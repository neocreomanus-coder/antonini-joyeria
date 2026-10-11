import { describe, expect, it } from "vitest";
import { shuffleCatalogProducts } from "./catalogShuffle";

describe("mezcla de catálogo", () => {
  it("devuelve una copia mezclada sin perder ni mutar referencias", () => {
    const products = ["A", "B", "C", "D"];
    const randomValues = [0.1, 0.7, 0.4];
    const shuffled = shuffleCatalogProducts(products, () => randomValues.shift() ?? 0);

    expect(shuffled).toEqual(["B", "D", "C", "A"]);
    expect(products).toEqual(["A", "B", "C", "D"]);
    expect(shuffled.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
