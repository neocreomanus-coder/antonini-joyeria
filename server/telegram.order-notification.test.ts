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
      popupDiscountPercent: 20,
      popupDiscountAmount: "50000",
      promoCode: "AHORRA15",
      promoDiscountAmount: "37500",
      items: [
        { productSnapshot: { name: "Producto de prueba de notificación", reference: "ANT-PRUEBA-001" }, quantity: 1 },
      ],
    });

    expect(result.sent).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/sendMessage");
    const payload = JSON.parse(String((options as RequestInit).body)) as { text: string };
    expect(payload.text).toContain("Notas adicionales:\nNOTA DE PRUEBA");
    expect(payload.text).toContain("Ref. ANT-PRUEBA-001");
    expect(payload.text).toContain("Código promocional usado: AHORRA15");
    expect(payload.text).toContain("Oferta popup: 20% OFF");
  });

  it("identifica de forma explícita cuando no se usó código promocional", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await notifyTelegramAboutOrder({
      orderId: 1000000,
      paymentMethod: "contraentrega",
      total: "200000",
      customerName: "Cliente sin promoción",
      customerPhone: "3000000001",
      items: [{ productSnapshot: { name: "Anillo de prueba" }, quantity: 1 }],
    });

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String((options as RequestInit).body)) as { text: string };
    expect(payload.text).toContain("Código promocional: sin aplicar");
  });

  it("reintenta automáticamente cuando Telegram migra el grupo a un supergrupo", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ parameters: { migrate_to_chat_id: -1003927178711 } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await notifyTelegramAboutOrder({
      orderId: 42,
      orderNumber: "ANT-030101",
      paymentMethod: "wompi",
      total: "900000",
      customerName: "Cliente de prueba",
      customerPhone: "3000000002",
      items: [{ productSnapshot: { name: "Anillo" }, quantity: 1 }],
    });

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retryOptions] = fetchMock.mock.calls[1];
    expect(JSON.parse(String((retryOptions as RequestInit).body))).toMatchObject({
      chat_id: "-1003927178711",
    });
  });
});
