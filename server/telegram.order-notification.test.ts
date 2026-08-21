import { describe, expect, it } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyTelegramAboutOrder } from "./telegram";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notificación de pedido a Telegram", () => {
  it("incluye todos los datos requeridos en el mensaje de pedido", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await notifyTelegramAboutOrder({
      orderId: 999999,
      paymentMethod: "wompi",
      total: "250000",
      customerName: "PRUEBA TÉCNICA — NO DESPACHAR",
      customerPhone: "3000000000",
      notes: "NOTA DE PRUEBA — entregar después de las 4 p. m.",
      items: [
        { productSnapshot: { name: "Producto de prueba de notificación" }, quantity: 1 },
      ],
    });

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sendMessage"),
      expect.objectContaining({
        body: expect.stringContaining("Notas adicionales:\\nNOTA DE PRUEBA"),
      }),
    );
  });
});
