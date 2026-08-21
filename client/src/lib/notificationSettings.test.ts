import { describe, expect, it } from "vitest";
import { NOTIFICATION_SETTINGS } from "./notificationSettings";

describe("configuración de notificaciones", () => {
  it("las aleja del encabezado y permite cerrarlas", () => {
    expect(NOTIFICATION_SETTINGS.position).toBe("bottom-center");
    expect(NOTIFICATION_SETTINGS.closeButton).toBe(true);
    expect(NOTIFICATION_SETTINGS.duration).toBeLessThanOrEqual(3000);
  });
});
