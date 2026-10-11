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
    value: "RUBÍ",
    label: "Rubí",
    detail: "Gema roja seleccionada",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#fff3f3_0%,#e94552_32%,#a70e24_68%,#fff1f1_100%)]",
  },
  {
    value: "DIAMANTES",
    label: "Diamantes",
    detail: "Brillo diamante",
    swatchClass: "bg-[radial-gradient(circle_at_28%_22%,#ffffff_0%,#e4f3ff_32%,#a8bed8_67%,#ffffff_100%)]",
  },
  {
    value: "DIAMANTE NEGRO",
    label: "Diamante Negro",
    detail: "Brillo negro intenso",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#94a3b8_0%,#334155_32%,#090d14_70%,#b7c1ce_100%)]",
  },
  {
    value: "DIAMANTE AZUL",
    label: "Diamante Azul",
    detail: "Brillo azul profundo",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#e0f2fe_0%,#60a5fa_32%,#1d4ed8_68%,#dbeafe_100%)]",
  },
  {
    value: "DIAMANTE AMARILLO",
    label: "Diamante Amarillo",
    detail: "Brillo amarillo radiante",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#fffde7_0%,#fde047_34%,#ca8a04_70%,#fff9c4_100%)]",
  },
  {
    value: "ÓPALO",
    label: "Ópalo",
    detail: "Reflejos iridiscentes",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#bbf7d0_27%,#c4b5fd_53%,#f9a8d4_74%,#fefce8_100%)]",
  },
  {
    value: "CIRCÓN SUIZO",
    label: "Circón Suizo",
    detail: "Brillo cristalino azul",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#f0f9ff_0%,#7dd3fc_31%,#0284c7_66%,#e0f2fe_100%)]",
  },
  {
    value: "AMATISTA",
    label: "Amatista",
    detail: "Gema violeta seleccionada",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#f3e8ff_0%,#a855f7_33%,#6b21a8_70%,#ede9fe_100%)]",
  },
  {
    value: "ZAFIRO",
    label: "Zafiro",
    detail: "Azul zafiro profundo",
    swatchClass: "bg-[radial-gradient(circle_at_30%_25%,#dbeafe_0%,#2563eb_31%,#172554_70%,#dbeafe_100%)]",
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
