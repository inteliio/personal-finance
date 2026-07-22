import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  getSubcategories,
  isValidSubcategory,
} from "@/lib/constants";

describe("isValidSubcategory", () => {
  it("allows empty subcategory", () => {
    expect(isValidSubcategory("Food", undefined)).toBe(true);
    expect(isValidSubcategory("Food", "")).toBe(true);
  });

  it("accepts a subcategory that belongs to the category", () => {
    expect(isValidSubcategory("Food", "Coffee")).toBe(true);
    expect(isValidSubcategory("Transport", "Fuel")).toBe(true);
  });

  it("rejects a subcategory from another category", () => {
    expect(isValidSubcategory("Food", "Fuel")).toBe(false);
    expect(isValidSubcategory("Bills", "Coffee")).toBe(false);
  });

  it("rejects unknown subcategory values", () => {
    expect(isValidSubcategory("Other", "NotARealSub")).toBe(false);
  });
});

describe("getSubcategories", () => {
  it("returns the list for each known category", () => {
    for (const category of CATEGORIES) {
      const subs = getSubcategories(category);
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBeGreaterThan(0);
    }
  });

  it("includes Coffee under Food", () => {
    expect(getSubcategories("Food")).toContain("Coffee");
  });
});
