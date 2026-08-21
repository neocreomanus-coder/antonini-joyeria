import { describe, expect, it } from "vitest";
import { buildWhatsAppPurchaseUrl } from "./whatsappPurchase";

describe("buildWhatsAppPurchaseUrl", () => {
  it("abre el WhatsApp oficial con producto, precio y envío gratis", () => {
    const url = new URL(buildWhatsAppPurchaseUrl({
      productName: "Cadena Cubana Oro 18K",
      priceLabel: "$ 250.000",
      selectedOption: "largo 45 cm",
    }));

    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/573169308533");
    expect(url.searchParams.get("text")).toContain("Cadena Cubana Oro 18K");
    expect(url.searchParams.get("text")).toContain("largo 45 cm");
    expect(url.searchParams.get("text")).toContain("$ 250.000");
    expect(url.searchParams.get("text")).toContain("envío gratis");
  });
});
