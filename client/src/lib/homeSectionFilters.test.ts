import { describe, expect, it } from "vitest";
import { getAssignedJewelryProducts, getAssignedTrendingProducts, isJewelryProduct } from "./homeSectionFilters";

describe("isJewelryProduct", () => {
  it("excluye fragancias de las secciones de precio de joyería", () => {
    expect(isJewelryProduct({ homeSection: "under300k", material: "Perfumería Original", volumeMl: 100, gender: "femenino" })).toBe(false);
    expect(isJewelryProduct({ homeSection: "under800k", categoryName: "Perfumería" })).toBe(false);
  });

  it("conserva joyería aunque esté asignada a una sección de precio", () => {
    expect(isJewelryProduct({ homeSection: "under300k", material: "Oro Laminado Americano", categoryName: "Cadenas" })).toBe(true);
  });

  it("conserva joyería con subcategoría de género", () => {
    expect(isJewelryProduct({ material: "Oro 18K Nacional", categoryName: "Pulseras", gender: "masculino" })).toBe(true);
  });

  it("no mezcla productos asignados a las dos secciones de precio", () => {
    const products = [
      { id: 1, homeSection: "under300k", material: "Oro 18K Nacional" },
      { id: 2, homeSection: "under800k", material: "Oro 18K Italiano" },
    ];
    expect(getAssignedJewelryProducts(products, "under300k").map(product => product.id)).toEqual([1]);
    expect(getAssignedJewelryProducts(products, "under800k").map(product => product.id)).toEqual([2]);
  });

  it("solo incluye productos marcados manualmente como tendencia", () => {
    const products = [
      { id: 1, homeSection: "trending" },
      { id: 2, homeSection: "under300k" },
      { id: 3, homeSection: null },
    ];
    expect(getAssignedTrendingProducts(products).map(product => product.id)).toEqual([1]);
  });
});
