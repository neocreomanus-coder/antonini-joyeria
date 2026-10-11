import { describe, expect, it } from "vitest";
import { getOrderPdfFilename, getShippingCarrierLabel } from "./orderPdf";

describe("orderPdf", () => {
  it("genera un nombre de archivo con el consecutivo público", () => {
    expect(getOrderPdfFilename({ id: 60001, orderNumber: "ANT-030101" })).toBe("pedido-ANT-030101.pdf");
  });

  it("usa el consecutivo tradicional cuando no existe número público", () => {
    expect(getOrderPdfFilename({ id: 42, orderNumber: null })).toBe("pedido-ANT-000042.pdf");
  });

  it("muestra correctamente las tres transportadoras", () => {
    expect(getShippingCarrierLabel("coordinadora")).toBe("Coordinadora");
    expect(getShippingCarrierLabel("interrapidisimo")).toBe("Inter Rapidísimo");
    expect(getShippingCarrierLabel("dhl")).toBe("DHL");
  });
});
