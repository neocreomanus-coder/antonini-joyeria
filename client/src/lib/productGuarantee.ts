export function getProductGuarantee(materials: string[]): string {
  const normalized = materials.map((material) => material.trim().toUpperCase());

  if (normalized.includes("PERFUMERÍA ORIGINAL") || normalized.includes("PERFUMERIA ORIGINAL") || normalized.includes("FRAGANCIA ORIGINAL")) {
    return "Fragancia Original";
  }

  if (normalized.includes("ESMERALDAS") || normalized.includes("MOISSANITAS")) {
    return "Piedra Garantizada";
  }

  if (normalized.includes("ORO 18K NACIONAL") || normalized.includes("ORO 18K ITALIANO")) {
    return "Garantía* de por vida";
  }

  if (normalized.includes("ORO LAMINADO AMERICANO")) {
    return "Garantía* por 1 año";
  }

  if (normalized.includes("ORO BLANCO") || normalized.includes("ORO ROSA") || normalized.includes("PLATA LEY 925") || normalized.includes("PLATA ITALIANA LEY 925")) {
    return "Metal Garantizado";
  }

  return "Certificado de autenticidad";
}

export type ProductTrustMessage = {
  id: string;
  text: string;
};

export function getProductTrustMessages(materials: string[], categorySlug?: string | null): ProductTrustMessage[] {
  const normalized = materials.map((material) => material.trim().toUpperCase());
  const isOriginalPerfumery =
    normalized.includes("PERFUMERÍA ORIGINAL") ||
    normalized.includes("PERFUMERIA ORIGINAL") ||
    normalized.includes("FRAGANCIA ORIGINAL") ||
    categorySlug?.trim().toLowerCase() === "perfumeria";

  if (isOriginalPerfumery) {
    return [
      { id: "fragrance-imported-original", text: "Fragancia Importada Original" },
      { id: "free-shipping", text: "Envío Gratis" },
      { id: "original-box", text: "Caja Original" },
    ];
  }

  return [
    { id: "material-guarantee", text: getProductGuarantee(materials) },
    { id: "cash-on-delivery", text: "Paga al recibir" },
    { id: "authenticity-certificate", text: "Certificado de autenticidad" },
  ];
}
