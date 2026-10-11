export type JewelryMaterialFilter = "" | "oro18k" | "oro-laminado" | "plata" | "piedras-preciosas";

export type CatalogMaterialProduct = {
  material?: string | null;
  materials?: string[] | null;
};

export const JEWELRY_MATERIAL_FILTERS: ReadonlyArray<{ value: JewelryMaterialFilter; label: string }> = [
  { value: "", label: "Todos los metales" },
  { value: "oro18k", label: "Oro 18K" },
  { value: "oro-laminado", label: "Oro Laminado" },
  { value: "plata", label: "Plata" },
  { value: "piedras-preciosas", label: "Piedras preciosas" },
];

const PRECIOUS_STONES = new Set([
  "ESMERALDAS",
  "MOISSANITAS",
  "RUBÍ",
  "DIAMANTES",
  "DIAMANTE NEGRO",
  "DIAMANTE AZUL",
  "DIAMANTE AMARILLO",
  "ÓPALO",
  "CIRCÓN SUIZO",
  "AMATISTA",
  "ZAFIRO",
]);

function normalizedMaterials(product: CatalogMaterialProduct): string[] {
  const values = product.materials?.length ? product.materials : [product.material];
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLocaleUpperCase("es-CO"));
}

export function matchesJewelryMaterialFilter(product: CatalogMaterialProduct, filter: JewelryMaterialFilter): boolean {
  if (!filter) return true;

  return normalizedMaterials(product).some((material) => {
    if (filter === "oro18k") return material.includes("ORO") && !material.includes("LAMINADO");
    if (filter === "oro-laminado") return material.includes("ORO LAMINADO");
    if (filter === "plata") return material.includes("PLATA") && material.includes("925");
    return PRECIOUS_STONES.has(material);
  });
}
