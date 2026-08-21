export const HOME_PRODUCT_CAROUSEL_STEP = 300;

export function getHomeProductCarouselOffset(direction: "left" | "right") {
  return direction === "left" ? -HOME_PRODUCT_CAROUSEL_STEP : HOME_PRODUCT_CAROUSEL_STEP;
}
