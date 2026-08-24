export type ProductGender = "masculino" | "femenino" | "unisex" | "ninos";

export function getGenderFilterValues(selectedGender: ProductGender): ProductGender[] {
  return selectedGender === "masculino" || selectedGender === "femenino"
    ? [selectedGender, "unisex"]
    : [selectedGender];
}
