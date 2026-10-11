export type InventoryRequest = {
  productId: number;
  variantId?: number | null;
  quantity: number;
};

/**
 * Une líneas repetidas antes de validar o descontar stock. Así una misma
 * variante nunca puede superar sus existencias repartiendo cantidades en
 * varias líneas del pedido.
 */
export function consolidateInventoryRequests<T extends InventoryRequest>(items: T[]): T[] {
  const requests = new Map<string, T>();

  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? "product"}`;
    const previous = requests.get(key);
    if (previous) {
      requests.set(key, { ...previous, quantity: previous.quantity + item.quantity });
    } else {
      requests.set(key, { ...item });
    }
  }

  return Array.from(requests.values());
}

export function inventoryUnavailableMessage() {
  return "No hay existencias suficientes para uno de los productos seleccionados. Actualiza tu carrito e inténtalo de nuevo.";
}
