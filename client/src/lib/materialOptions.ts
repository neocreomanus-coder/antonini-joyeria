export type MaterialOption = {
  value: string;
  label: string;
  swatchClass: string;
  detail: string;
};

export const MATERIAL_OPTIONS: MaterialOption[] = [
  {
    value: "PLATA LEY 925",
    label: "Plata Italiana Ley 925",
    detail: "Plata italiana certificada",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#d7dce1_34%,#86909c_70%,#f8fafc_100%)]",
  },
  {
    value: "ORO 18K NACIONAL",
    label: "Oro 18K Nacional",
    detail: "Oro macizo nacional",
    swatchClass: "bg-[radial-gradient(circle_at_34%_20%,#fffde2_0%,#fff6a8_12%,#ffd42a_38%,#c38800_72%,#fff1a0_100%)]",
  },
  {
    value: "ORO BLANCO",
    label: "Oro Blanco",
    detail: "Acabado blanco brillante",
    swatchClass: "bg-[radial-gradient(circle_at_31%_24%,#ffffff_0%,#f8fafc_18%,#cbd5e1_47%,#7b8798_76%,#ffffff_100%)]",
  },
  {
    value: "ORO ROSA",
    label: "Oro Rosa",
    detail: "Acabado rosa elegante",
    swatchClass: "bg-[radial-gradient(circle_at_31%_24%,#fff6f1_0%,#ffd9c9_24%,#de9a83_52%,#9c574b_78%,#ffe8de_100%)]",
  },
  {
    value: "ORO LAMINADO AMERICANO",
    label: "Oro Laminado Americano",
    detail: "Laminado americano",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#fff6bf_0%,#e9cf63_34%,#b58b1c_75%,#fff4bd_100%)]",
  },
  {
    value: "ORO 18K ITALIANO",
    label: "Oro 18K Italiano",
    detail: "Oro italiano",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#fff2b8_0%,#d3a338_37%,#875a07_76%,#fff6cb_100%)]",
  },
  {
    value: "ESMERALDAS",
    label: "Esmeraldas",
    detail: "Esmeraldas seleccionadas",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#bdf7c7_0%,#288b61_38%,#064a39_76%,#d2ffdf_100%)]",
  },
  {
    value: "MOISSANITAS",
    label: "Moissanitas",
    detail: "Brillo moissanita",
    swatchClass: "bg-[radial-gradient(circle_at_32%_25%,#ffffff_0%,#d9ecff_35%,#8198bf_70%,#ffffff_100%)]",
  },
  {
    value: "FRAGANCIA ORIGINAL",
    label: "Perfumería Original",
    detail: "Fragancia importada",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#e8d8ff_0%,#996ec1_40%,#35215b_78%,#f3e7ff_100%)]",
  },
];

const LEGACY_MATERIAL_VALUES: Record<string, string> = {
  "ORO 18K": "ORO 18K NACIONAL",
};

export function normalizeMaterialValue(value?: string | null) {
  if (!value) return "ORO 18K NACIONAL";
  return LEGACY_MATERIAL_VALUES[value.toUpperCase()] ?? value.toUpperCase();
}

export function getMaterialOption(value?: string | null): MaterialOption {
  const normalizedValue = normalizeMaterialValue(value);
  return MATERIAL_OPTIONS.find((option) => option.value === normalizedValue) ?? {
    value: normalizedValue,
    label: value ?? "Oro 18K Nacional",
    detail: "Material seleccionado",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#d7dce1_36%,#8e989f_78%,#ffffff_100%)]",
  };
}
