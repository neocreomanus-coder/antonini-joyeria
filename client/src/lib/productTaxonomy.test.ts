import { describe, expect, it } from "vitest";
import { JEWELRY_CATEGORIES, PERFUMERY_CATEGORY, PUBLIC_CATEGORIES, isPerfumeryCategory } from "./productTaxonomy";

describe("taxonomía pública de productos", () => {
  it("mantiene exclusivamente las categorías vigentes de joyería y perfumería", () => {
    expect(JEWELRY_CATEGORIES.map((category) => category.slug)).toEqual([
      "cadenas", "topos", "anillos", "dijes", "pulseras", "argollas",
    ]);
    expect(PERFUMERY_CATEGORY.slug).toBe("perfumeria");
    expect(PUBLIC_CATEGORIES.map((category) => category.slug)).not.toContain("pulsos");
    expect(PUBLIC_CATEGORIES.map((category) => category.slug)).not.toContain("brazaletes");
  });

  it("reconoce perfumería como un grupo separado de joyería", () => {
    expect(isPerfumeryCategory("perfumeria")).toBe(true);
    expect(isPerfumeryCategory("anillos")).toBe(false);
  });
});
