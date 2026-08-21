import { describe, expect, it } from "vitest";
import { buildPaymentProofWhatsAppUrl, formatOrderNumber } from "./paymentFlow";

describe("paymentFlow", () => {
  it("genera un número de pedido Antonini con relleno fijo", () => {
    expect(formatOrderNumber(42)).toBe("ANT-000042");
  });

  it("prepara un enlace de WhatsApp con el pedido y valor para el comprobante", () => {
    const url = buildPaymentProofWhatsAppUrl({ orderId: 42, total: "170000" });
    expect(url).toContain("https://wa.me/57316930853");
    expect(decodeURIComponent(url)).toContain("ANT-000042");
    expect(decodeURIComponent(url)).toContain("170.000");
  });
});
