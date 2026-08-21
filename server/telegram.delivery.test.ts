import { describe, expect, it } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTelegramConnectionTest } from "./telegram";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("entrega de Telegram", () => {
  it("envía una prueba controlada al chat configurado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendTelegramConnectionTest();

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sendMessage"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("conexión con Telegram verificada"),
      }),
    );
  });
});
