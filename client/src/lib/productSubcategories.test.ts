import { describe, expect, it } from "vitest";
import {
  getProductSubcategories,
  getSubcategoryTitle,
  JEWELRY_SUBCATEGORIES,
  PERFUMERY_SUBCATEGORIES,
  PERFUMERY_STYLES,
} from "./productSubcategories";

describe("subcategorías de producto", () => {
  it("mantiene fuentes independientes de subcategorías para joyería y perfumería", () => {
    expect(JEWELRY_SUBCATEGORIES).not.toBe(PERFUMERY_SUBCATEGORIES);
    expect(getProductSubcategories("anillos")).toBe(JEWELRY_SUBCATEGORIES);
    expect(getProductSubcategories("perfumeria")).toBe(PERFUMERY_SUBCATEGORIES);
    expect(PERFUMERY_SUBCATEGORIES.map((option) => option.value)).toEqual(["", "masculino", "femenino", "unisex", "ninos"]);
    expect(PERFUMERY_STYLES.map((option) => option.value)).toEqual(["", "arabe"]);
  });

  it("usa un título específico según el tipo de catálogo", () => {
    expect(getSubcategoryTitle("perfumeria")).toBe("Perfumería por subcategoría");
    expect(getSubcategoryTitle("anillos")).toBe("Joyería por subcategoría");
  });
});
