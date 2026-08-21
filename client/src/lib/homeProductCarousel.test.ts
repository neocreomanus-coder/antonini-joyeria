import { describe, expect, it } from "vitest";
import { getHomeProductCarouselOffset, HOME_PRODUCT_CAROUSEL_STEP } from "./homeProductCarousel";

describe("carrusel de productos del inicio", () => {
  it("desplaza cada control en la dirección correspondiente", () => {
    expect(getHomeProductCarouselOffset("left")).toBe(-HOME_PRODUCT_CAROUSEL_STEP);
    expect(getHomeProductCarouselOffset("right")).toBe(HOME_PRODUCT_CAROUSEL_STEP);
  });
});
