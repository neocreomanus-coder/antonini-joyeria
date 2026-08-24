import { describe, expect, it } from "vitest";
import { shouldShowProductImageDisclaimer } from "./productImageDisclaimer";

describe("aviso de imagen de referencia", () => {
  it("se muestra para joyería y se excluye de perfumería", () => {
    expect(shouldShowProductImageDisclaimer("cadenas")).toBe(true);
    expect(shouldShowProductImageDisclaimer("perfumeria")).toBe(false);
  });
});
