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

export type PopupOfferConfig = {
  enabled?: boolean;
  productId?: number | null;
  discount?: number;
} | null | undefined;

export function getPopupOfferForProduct(productId: number, regularPrice: number, popupConfig: PopupOfferConfig) {
  const discountPercent = popupConfig?.enabled && popupConfig.productId === productId && (popupConfig.discount ?? 0) > 0
    ? popupConfig.discount ?? 0
    : 0;
  const price = discountPercent > 0
    ? Math.round(regularPrice * (1 - discountPercent / 100) * 100) / 100
    : regularPrice;
  return { price, discountPercent, hasPopupOffer: discountPercent > 0 };
}
