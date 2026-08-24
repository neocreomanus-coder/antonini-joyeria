export const PRODUCT_IMAGE_DISCLAIMER_LINES = [
  "El color puede variar respecto al producto físico.",
  "El tamaño mostrado no representa el tamaño real del producto.",
];

export function shouldShowProductImageDisclaimer(categorySlug?: string | null) {
  return categorySlug !== "perfumeria";
}
