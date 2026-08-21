export type HomeSectionProduct = {
  homeSection?: string | null;
  material?: string | null;
  categoryName?: string | null;
  volumeMl?: number | null;
  gender?: string | null;
};

export function isJewelryProduct(product: HomeSectionProduct): boolean {
  const classification = [product.homeSection, product.material, product.categoryName]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("es-CO");

  return product.volumeMl == null
    && !classification.includes("perfumer")
    && !classification.includes("fragancia");
}

export function getAssignedJewelryProducts<T extends HomeSectionProduct>(products: T[], section: "under300k" | "under800k") {
  return products.filter(product => product.homeSection === section && isJewelryProduct(product));
}

export function getAssignedTrendingProducts<T extends HomeSectionProduct>(products: T[]) {
  return products.filter(product => product.homeSection === "trending");
}
