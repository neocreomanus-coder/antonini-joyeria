import { describe, expect, it } from "vitest";
import { getNextTieredCartDiscount, getTieredCartDiscountPercentage } from "./cartDiscount";

describe("descuento escalonado del carrito", () => {
  it("activa el descuento cuando se agregan dos unidades del mismo producto", () => {
    expect(getTieredCartDiscountPercentage(2)).toBe(5);
    expect(getNextTieredCartDiscount(2)).toEqual({ need: 1, pct: 10 });
  });

  it("aumenta las escalas según la cantidad total de unidades", () => {
    expect(getTieredCartDiscountPercentage(3)).toBe(10);
    expect(getTieredCartDiscountPercentage(4)).toBe(15);
  });
});
