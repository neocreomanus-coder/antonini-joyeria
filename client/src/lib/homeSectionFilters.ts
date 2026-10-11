export type HomeSectionProduct = {
  homeSection?: string | null;
  material?: string | null;
  materials?: string[] | null;
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

export function getAssignedItalianSilverProducts<T extends HomeSectionProduct>(products: T[]) {
  return products.filter(product => {
    const materials = [product.material, ...(product.materials ?? [])]
      .filter((material): material is string => Boolean(material))
      .map(material => material.toLocaleUpperCase("es-CO"));

    return product.homeSection === "silver925"
      && isJewelryProduct(product)
      && materials.some(material => material === "PLATA LEY 925" || material === "PLATA ITALIANA LEY 925");
  });
}

export function getAssignedTrendingProducts<T extends HomeSectionProduct>(products: T[]) {
  return products.filter(product => product.homeSection === "trending");
}
