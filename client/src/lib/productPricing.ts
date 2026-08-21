export function getCartDiscountPercentage(itemCountBeforeAdding: number): number {
  const nextItemCount = itemCountBeforeAdding + 1;
  if (nextItemCount >= 4) return 15;
  if (nextItemCount >= 3) return 10;
  if (nextItemCount >= 2) return 5;
  return 0;
}

export function getPreviewProductPrice(price: number, itemCountBeforeAdding: number) {
  const discountPct = getCartDiscountPercentage(itemCountBeforeAdding);
  const discountedPrice = price * (1 - discountPct / 100);

  return {
    discountPct,
    discountedPrice,
    hasDiscount: discountedPrice < price,
  };
}

export function getDisplayProductPrice(currentPrice: number, originalPrice: number | undefined, itemCountBeforeAdding: number) {
  const preview = getPreviewProductPrice(currentPrice, itemCountBeforeAdding);
  const compareAtPrice = originalPrice && originalPrice > currentPrice ? originalPrice : currentPrice;

  return {
    ...preview,
    compareAtPrice,
    hasQuantityDiscount: preview.hasDiscount,
    hasDiscount: preview.hasDiscount || compareAtPrice > currentPrice,
  };
}
