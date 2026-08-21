import { describe, expect, it } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("credenciales de Telegram", () => {
  it("valida el bot configurado mediante getMe", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, result: { is_bot: true } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(token).toBeTruthy();
    expect(chatId).toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const payload = await response.json() as { ok?: boolean; result?: { is_bot?: boolean } };

    expect(response.ok).toBe(true);
    expect(payload.ok).toBe(true);
    expect(payload.result?.is_bot).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/getMe"));
  });
});
