import { describe, expect, it } from "vitest";
import { getDisplayProductPrice, getPopupOfferForProduct, getPreviewProductPrice } from "./productPricing";

describe("getPreviewProductPrice", () => {
  it("conserva el precio cuando agregar el producto no activa descuento", () => {
    expect(getPreviewProductPrice(143000, 0)).toEqual({
      discountPct: 0,
      discountedPrice: 143000,
      hasDiscount: false,
    });
  });

  it("muestra el 5% y mantiene el precio original para tacharlo al sumar dos piezas", () => {
    expect(getPreviewProductPrice(143000, 1)).toEqual({
      discountPct: 5,
      discountedPrice: 135850,
      hasDiscount: true,
    });
  });

  it("aplica los niveles de 10% y 15% al sumar tres o cuatro piezas", () => {
    expect(getPreviewProductPrice(100000, 2).discountPct).toBe(10);
    expect(getPreviewProductPrice(100000, 3).discountPct).toBe(15);
  });

  it("muestra el precio anterior configurado aunque aún no haya descuento por cantidad", () => {
    expect(getDisplayProductPrice(135850, 143000, 0)).toMatchObject({
      discountedPrice: 135850,
      compareAtPrice: 143000,
      hasDiscount: true,
    });
  });

  it("no muestra precio tachado si el precio anterior no es mayor al precio actual", () => {
    expect(getDisplayProductPrice(143000, 135850, 0)).toMatchObject({
      compareAtPrice: 143000,
      hasDiscount: false,
    });
  });

  it("aplica únicamente la oferta activa del popup al producto seleccionado", () => {
    expect(getPopupOfferForProduct(4, 2_000_000, { enabled: true, productId: 4, discount: 50 })).toEqual({
      price: 1_000_000,
      discountPercent: 50,
      hasPopupOffer: true,
    });
    expect(getPopupOfferForProduct(5, 2_000_000, { enabled: true, productId: 4, discount: 50 })).toMatchObject({
      price: 2_000_000,
      hasPopupOffer: false,
    });
    expect(getPopupOfferForProduct(4, 2_000_000, { enabled: false, productId: 4, discount: 50 })).toMatchObject({
      price: 2_000_000,
      hasPopupOffer: false,
    });
  });
});
