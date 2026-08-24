import { describe, expect, it } from "vitest";
import { buildPaymentProofWhatsAppUrl, formatOrderNumber } from "./paymentFlow";

describe("paymentFlow", () => {
  it("genera un número de pedido Antonini con relleno fijo", () => {
    expect(formatOrderNumber(42)).toBe("ANT-000042");
  });

  it("conserva los consecutivos públicos asignados por cada método de pago", () => {
    expect(formatOrderNumber("ANT-030101")).toBe("ANT-030101");
    expect(formatOrderNumber("ANT-001001")).toBe("ANT-001001");
  });

  it("prepara un enlace de WhatsApp con el pedido y valor para el comprobante", () => {
    const url = buildPaymentProofWhatsAppUrl({ orderId: 42, total: "170000" });
    expect(url).toContain("https://wa.me/57316930853");
    expect(decodeURIComponent(url)).toContain("ANT-000042");
    expect(decodeURIComponent(url)).toContain("170.000");
  });

  it("comunica por WhatsApp el consecutivo público Wompi sin reconstruirlo desde el ID", () => {
    const url = buildPaymentProofWhatsAppUrl({ orderId: 60001, orderNumber: "ANT-030101", total: "900000" });
    expect(decodeURIComponent(url)).toContain("ANT-030101");
    expect(decodeURIComponent(url)).not.toContain("ANT-060001");
  });
});
