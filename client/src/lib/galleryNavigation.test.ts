import { describe, expect, it } from "vitest";
import { getGalleryImageIndex, getGallerySwipeDirection } from "./galleryNavigation";

describe("getGalleryImageIndex", () => {
  it("avanza con la flecha siguiente y vuelve al inicio", () => {
    expect(getGalleryImageIndex(0, 2, "next")).toBe(1);
    expect(getGalleryImageIndex(1, 2, "next")).toBe(0);
  });

  it("retrocede con la flecha anterior y vuelve al final", () => {
    expect(getGalleryImageIndex(1, 2, "previous")).toBe(0);
    expect(getGalleryImageIndex(0, 2, "previous")).toBe(1);
  });

  it("mantiene una posición segura si no hay imágenes", () => {
    expect(getGalleryImageIndex(0, 0, "next")).toBe(0);
  });

  it("convierte un deslizamiento horizontal en la dirección correcta", () => {
    expect(getGallerySwipeDirection(200, 120)).toBe("next");
    expect(getGallerySwipeDirection(120, 200)).toBe("previous");
    expect(getGallerySwipeDirection(200, 180)).toBeNull();
  });

  it("no cambia la imagen ante un toque sin desplazamiento", () => {
    expect(getGallerySwipeDirection(180, 180)).toBeNull();
    expect(getGallerySwipeDirection(180, 188)).toBeNull();
  });
});
