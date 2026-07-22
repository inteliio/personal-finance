export type NavItem = {
  href: "/" | "/transactions";
  label: string;
  shortLabel: string;
  icon: "add" | "list";
};

export const APP_NAV: readonly NavItem[] = [
  { href: "/", label: "New expense", shortLabel: "Add", icon: "add" },
  { href: "/transactions", label: "Transactions", shortLabel: "Transactions", icon: "list" },
] as const;
