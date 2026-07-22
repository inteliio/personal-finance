"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  CATEGORIES,
  EXPENSE_TYPES,
  getSubcategories,
  isValidSubcategory,
  type Category,
  type ExpenseType,
} from "@/lib/constants";

const LAST_EXPENSE_KEY = "pf-last-expense";

type LastExpenseDefaults = {
  expenseType: ExpenseType;
  category: Category;
  subcategory: string;
};

type MeResponse = {
  spreadsheetId?: string;
  sheetUrl?: string;
  sheetReady?: boolean;
  error?: string;
};

type Props = {
  userName?: string | null;
  initialSpreadsheetId?: string;
};

function isExpenseType(value: unknown): value is ExpenseType {
  return typeof value === "string" && (EXPENSE_TYPES as readonly string[]).includes(value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function readLastExpenseDefaults(): LastExpenseDefaults | null {
  try {
    const raw = window.localStorage.getItem(LAST_EXPENSE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastExpenseDefaults>;
    if (!isExpenseType(parsed.expenseType) || !isCategory(parsed.category)) {
      return null;
    }
    const subcategory =
      typeof parsed.subcategory === "string" &&
      isValidSubcategory(parsed.category, parsed.subcategory)
        ? parsed.subcategory
        : "";
    return {
      expenseType: parsed.expenseType,
      category: parsed.category,
      subcategory,
    };
  } catch {
    return null;
  }
}

function writeLastExpenseDefaults(defaults: LastExpenseDefaults) {
  try {
    window.localStorage.setItem(LAST_EXPENSE_KEY, JSON.stringify(defaults));
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function ExpenseForm({ userName, initialSpreadsheetId }: Props) {
  const { update } = useSession();
  const [productName, setProductName] = useState("");
  const [amountMkd, setAmountMkd] = useState("");
  const [expenseType, setExpenseType] = useState<ExpenseType>("need");
  const [category, setCategory] = useState<Category>("Other");
  const [subcategory, setSubcategory] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState(initialSpreadsheetId);
  const [sheetHref, setSheetHref] = useState(
    initialSpreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${initialSpreadsheetId}`
      : null,
  );

  const persistSheetId = useCallback(
    async (id: string, url?: string) => {
      setSpreadsheetId(id);
      setSheetHref(url ?? `https://docs.google.com/spreadsheets/d/${id}`);
      await update({ spreadsheetId: id });
    },
    [update],
  );

  useEffect(() => {
    const defaults = readLastExpenseDefaults();
    if (!defaults) return;
    setExpenseType(defaults.expenseType);
    setCategory(defaults.category);
    setSubcategory(defaults.subcategory);
  }, []);

  useEffect(() => {
    if (initialSpreadsheetId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = (await res.json()) as MeResponse;
        if (cancelled || !data.spreadsheetId) return;
        await persistSheetId(data.spreadsheetId, data.sheetUrl);
      } catch {
        // Sheet bootstrap can wait until first save
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSpreadsheetId, persistSheetId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          amountMkd: Number(amountMkd),
          expenseType,
          category,
          subcategory: subcategory || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      if (data.spreadsheetId) {
        await persistSheetId(data.spreadsheetId, data.sheetUrl);
      }

      writeLastExpenseDefaults({ expenseType, category, subcategory });

      // Clear entry fields only — keep type/category/subcategory for faster re-entry
      setProductName("");
      setAmountMkd("");
      setNote("");
      setShowNote(false);
      setStatus("ok");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)] sm:px-6 sm:py-8 md:pb-8">
        <AppHeader title="New expense" userName={userName} />

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Amount (MKD)</span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            step="any"
            required
            autoFocus
            value={amountMkd}
            onChange={(e) => setAmountMkd(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-3xl font-semibold tabular-nums tracking-tight outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Product name</span>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Coffee, groceries…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          />
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Type</legend>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_TYPES.map((type) => (
              <Chip
                key={type}
                selected={expenseType === type}
                onClick={() => setExpenseType(type)}
                label={type}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Category</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onClick={() => {
                  setCategory(cat);
                  setSubcategory("");
                }}
                label={cat}
              />
            ))}
          </div>
        </fieldset>

        {getSubcategories(category).length > 0 ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Subcategory (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {getSubcategories(category).map((sub) => (
                <Chip
                  key={sub}
                  selected={subcategory === sub}
                  onClick={() => setSubcategory(subcategory === sub ? "" : sub)}
                  label={sub}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        <div>
          {!showNote ? (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              Add note (optional)
            </button>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Note</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional context"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
              />
            </label>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {status === "ok" ? (
            <p className="text-center text-sm font-medium text-[var(--ok)]" role="status">
              Saved. Type and category kept for the next entry.
            </p>
          ) : null}
          {status === "error" && error ? (
            <p className="text-center text-sm font-medium text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-[var(--accent)] text-lg font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {sheetHref ? (
            <a
              href={sheetHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              Open spreadsheet in Drive
            </a>
          ) : spreadsheetId ? null : (
            <p className="text-center text-xs text-[var(--muted)]">
              Spreadsheet is created on first save
            </p>
          )}
        </div>
        </form>
      </main>
      <BottomNav />
    </>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition ${
        selected
          ? "bg-[var(--accent)] text-[var(--accent-fg)]"
          : "bg-[var(--chip)] text-[var(--foreground)] hover:bg-[var(--chip-hover)]"
      }`}
    >
      {label}
    </button>
  );
}
