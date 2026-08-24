import { describe, expect, it } from "vitest";
import { getProductGuarantee, getProductTrustMessages } from "./productGuarantee";

describe("garantía por material", () => {
  it("muestra garantía de por vida para Oro 18K Nacional e Italiano", () => {
    expect(getProductGuarantee(["ORO 18K NACIONAL"])).toBe("Garantía* de por vida");
    expect(getProductGuarantee(["ORO 18K ITALIANO"])).toBe("Garantía* de por vida");
  });

  it("muestra garantía por un año para Oro Laminado", () => {
    expect(getProductGuarantee(["ORO LAMINADO AMERICANO"])).toBe("Garantía* por 1 año");
  });

  it("muestra Piedra Garantizada para Esmeraldas y Moissanitas", () => {
    expect(getProductGuarantee(["ESMERALDAS"])).toBe("Piedra Garantizada");
    expect(getProductGuarantee(["MOISSANITAS"])).toBe("Piedra Garantizada");
  });

  it("muestra Metal Garantizado para Oro Blanco, Oro Rosa y Plata Italiana", () => {
    expect(getProductGuarantee(["ORO BLANCO"])).toBe("Metal Garantizado");
    expect(getProductGuarantee(["ORO ROSA"])).toBe("Metal Garantizado");
    expect(getProductGuarantee(["PLATA LEY 925"])).toBe("Metal Garantizado");
  });

  it("muestra autenticidad de fragancia para Perfumería", () => {
    expect(getProductGuarantee(["PERFUMERÍA ORIGINAL"])).toBe("Fragancia Original");
    expect(getProductGuarantee(["FRAGANCIA ORIGINAL"])).toBe("Fragancia Original");
  });

  it("prioriza Perfumería para productos con más de un material", () => {
    expect(getProductGuarantee(["ORO 18K NACIONAL", "PERFUMERÍA ORIGINAL"])).toBe("Fragancia Original");
  });

  it("muestra los tres mensajes comerciales exclusivos para Perfumería Original", () => {
    expect(getProductTrustMessages(["PERFUMERÍA ORIGINAL"])).toEqual([
      { id: "fragrance-imported-original", text: "Fragancia Importada Original" },
      { id: "free-shipping", text: "Envío Gratis" },
      { id: "original-box", text: "Caja Original" },
    ]);
  });

  it("reconoce la categoría de Perfumería aunque el material heredado sea distinto", () => {
    expect(getProductTrustMessages(["ORO 18K NACIONAL"], "perfumeria").map((item) => item.text)).toEqual([
      "Fragancia Importada Original",
      "Envío Gratis",
      "Caja Original",
    ]);
  });
});
