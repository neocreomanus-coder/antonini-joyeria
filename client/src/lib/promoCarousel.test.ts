import { describe, expect, it } from "vitest";
import { getNextCarouselIndex } from "./promoCarousel";

describe("getNextCarouselIndex", () => {
  it("advances to the next slide and wraps after the final slide", () => {
    expect(getNextCarouselIndex(0, 2)).toBe(1);
    expect(getNextCarouselIndex(1, 2)).toBe(0);
  });

  it("returns the stable initial index when no slides are available", () => {
    expect(getNextCarouselIndex(0, 0)).toBe(0);
  });
});
