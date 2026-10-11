import { describe, expect, it } from "vitest";
import { matchesJewelryMaterialFilter } from "./catalogMaterialFilters";

describe("filtros de metales del catálogo", () => {
  it("reúne todos los oros excepto el oro laminado", () => {
    expect(matchesJewelryMaterialFilter({ materials: ["ORO 18K NACIONAL"] }, "oro18k")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO 18K ITALIANO", "ESMERALDAS"] }, "oro18k")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO BLANCO"] }, "oro18k")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO ROSA"] }, "oro18k")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO LAMINADO AMERICANO"] }, "oro18k")).toBe(false);
  });

  it("incluye exclusivamente las referencias de oro laminado", () => {
    expect(matchesJewelryMaterialFilter({ material: "ORO LAMINADO AMERICANO" }, "oro-laminado")).toBe(true);
    expect(matchesJewelryMaterialFilter({ material: "ORO 18K NACIONAL" }, "oro-laminado")).toBe(false);
  });

  it("incluye únicamente plata italiana ley 925", () => {
    expect(matchesJewelryMaterialFilter({ materials: ["PLATA LEY 925"] }, "plata")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["PLATA ITALIANA LEY 925"] }, "plata")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO BLANCO"] }, "plata")).toBe(false);
  });

  it("agrupa las joyas que contienen piedras preciosas", () => {
    expect(matchesJewelryMaterialFilter({ materials: ["ORO 18K NACIONAL", "ESMERALDAS"] }, "piedras-preciosas")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["DIAMANTE NEGRO"] }, "piedras-preciosas")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["MOISSANITAS"] }, "piedras-preciosas")).toBe(true);
    expect(matchesJewelryMaterialFilter({ materials: ["ORO 18K ITALIANO"] }, "piedras-preciosas")).toBe(false);
    expect(matchesJewelryMaterialFilter({ materials: ["PLATA LEY 925"] }, "piedras-preciosas")).toBe(false);
  });
});
