import { describe, expect, it } from "vitest";
import { getRenderableTestimonials, getTestimonialWindow } from "./testimonialCarousel";

describe("carrusel de testimonios", () => {
  it("descarta entradas sin nombre o comentario para evitar tarjetas indefinidas", () => {
    expect(getRenderableTestimonials([
      { id: 1, name: "Ana", comment: "Excelente atención" },
      { id: 2, name: "", comment: "Sin nombre" },
      { id: 3, name: "Luis", comment: null },
      undefined as never,
    ])).toEqual([{ id: 1, name: "Ana", comment: "Excelente atención" }]);
  });

  it("normaliza índices fuera de rango sin devolver elementos indefinidos", () => {
    expect(getTestimonialWindow(["A", "B", "C"], 5)).toEqual(["C", "A", "B"]);
    expect(getTestimonialWindow(["A", "B"], -1)).toEqual(["B", "A"]);
    expect(getTestimonialWindow([], 0)).toEqual([]);
  });
});
