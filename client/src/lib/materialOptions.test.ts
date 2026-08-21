import { describe, expect, it } from "vitest";
import { getMaterialOption, MATERIAL_OPTIONS, normalizeMaterialValue } from "./materialOptions";

describe("materialOptions", () => {
  it("normaliza el valor histórico ORO 18K al acabado nacional", () => {
    expect(normalizeMaterialValue("ORO 18K")).toBe("ORO 18K NACIONAL");
    expect(getMaterialOption("ORO 18K").label).toBe("Oro 18K Nacional");
  });

  it("reconoce los acabados de gemas solicitados", () => {
    expect(getMaterialOption("ESMERALDAS").label).toBe("Esmeraldas");
    expect(getMaterialOption("MOISSANITAS").label).toBe("Moissanitas");
  });

  it("mantiene un brillo amarillo diferenciado para Oro 18K Nacional", () => {
    expect(getMaterialOption("ORO 18K NACIONAL").swatchClass).toContain("#ffd42a");
  });

  it("ofrece cada acabado elegible en el selector administrativo", () => {
    expect(MATERIAL_OPTIONS.map((option) => option.value)).toEqual(expect.arrayContaining([
      "PLATA LEY 925",
      "ORO 18K NACIONAL",
      "ORO LAMINADO AMERICANO",
      "ORO 18K ITALIANO",
      "ESMERALDAS",
      "MOISSANITAS",
    ]));
  });
});
