export type PublicCategory = { name: string; slug: string };

export const JEWELRY_CATEGORIES: readonly PublicCategory[] = [
  { name: "Cadenas", slug: "cadenas" },
  { name: "Topos", slug: "topos" },
  { name: "Anillos", slug: "anillos" },
  { name: "Dijes", slug: "dijes" },
  { name: "Pulseras", slug: "pulseras" },
  { name: "Argollas", slug: "argollas" },
];

export const PERFUMERY_CATEGORY: PublicCategory = { name: "Perfumería", slug: "perfumeria" };
export const PUBLIC_CATEGORIES: readonly PublicCategory[] = [...JEWELRY_CATEGORIES, PERFUMERY_CATEGORY];

export function isPerfumeryCategory(categorySlug: string) {
  return categorySlug === PERFUMERY_CATEGORY.slug;
}

export function getPublicCategory(categorySlug: string) {
  return PUBLIC_CATEGORIES.find((category) => category.slug === categorySlug);
}
