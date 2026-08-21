export const JEWELRY_SUBCATEGORIES = [
  { value: "", label: "Todos" },
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "unisex", label: "Unisex" },
  { value: "ninos", label: "Niños" },
] as const;

export const PERFUMERY_SUBCATEGORIES = [
  { value: "", label: "Todos" },
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "unisex", label: "Unisex" },
  { value: "ninos", label: "Niños" },
] as const;

// Compatibilidad para cualquier integración anterior que aún importe esta constante.
export const PRODUCT_SUBCATEGORIES = JEWELRY_SUBCATEGORIES;

export function getProductSubcategories(categorySlug: string) {
  return categorySlug === "perfumeria" ? PERFUMERY_SUBCATEGORIES : JEWELRY_SUBCATEGORIES;
}

export function getSubcategoryTitle(categorySlug: string): string {
  return categorySlug === "perfumeria" ? "Perfumería por subcategoría" : "Joyería por subcategoría";
}
