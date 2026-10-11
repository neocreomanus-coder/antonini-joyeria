import { describe, expect, it } from "vitest";
import { consolidateInventoryRequests, inventoryUnavailableMessage } from "./inventory";

describe("consolidación de inventario", () => {
  it("suma líneas repetidas del mismo producto y variante antes de descontar", () => {
    expect(consolidateInventoryRequests([
      { productId: 1, variantId: 10, quantity: 1 },
      { productId: 1, variantId: 10, quantity: 2 },
      { productId: 1, variantId: 11, quantity: 1 },
      { productId: 2, quantity: 3 },
      { productId: 2, quantity: 2 },
    ])).toEqual([
      { productId: 1, variantId: 10, quantity: 3 },
      { productId: 1, variantId: 11, quantity: 1 },
      { productId: 2, quantity: 5 },
    ]);
  });

  it("mantiene un mensaje de inventario comprensible para el cliente", () => {
    expect(inventoryUnavailableMessage()).toContain("existencias suficientes");
  });
});
