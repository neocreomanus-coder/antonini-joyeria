import { describe, expect, it } from "vitest";
import { getGenderFilterValues } from "../shared/genderFiltering";

describe("filtrado por género", () => {
  it("incluye Unisex al filtrar por Masculino o Femenino", () => {
    expect(getGenderFilterValues("masculino")).toEqual(["masculino", "unisex"]);
    expect(getGenderFilterValues("femenino")).toEqual(["femenino", "unisex"]);
  });

  it("mantiene los filtros Unisex y Niños sin ampliar", () => {
    expect(getGenderFilterValues("unisex")).toEqual(["unisex"]);
    expect(getGenderFilterValues("ninos")).toEqual(["ninos"]);
  });
});
