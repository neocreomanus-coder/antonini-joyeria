import { describe, expect, it } from "vitest";
import { shouldHideWelcomePopup } from "./popupVisibility";

describe("visibilidad del popup promocional", () => {
  it("mantiene el popup disponible en las rutas comerciales públicas", () => {
    expect(shouldHideWelcomePopup("/")).toBe(false);
    expect(shouldHideWelcomePopup("/catalogo")).toBe(false);
    expect(shouldHideWelcomePopup("/producto/perfume-garlite")).toBe(false);
  });

  it("lo oculta en administración, checkout, pago, confirmación y rastreo", () => {
    expect(shouldHideWelcomePopup("/admin/productos")).toBe(true);
    expect(shouldHideWelcomePopup("/checkout")).toBe(true);
    expect(shouldHideWelcomePopup("/pago/wompi/token-publico")).toBe(true);
    expect(shouldHideWelcomePopup("/pedido-confirmado/token-publico")).toBe(true);
    expect(shouldHideWelcomePopup("/rastrear-pedido")).toBe(true);
  });
});
