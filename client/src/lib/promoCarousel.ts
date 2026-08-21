export function getNextCarouselIndex(currentIndex: number, slideCount: number) {
  if (slideCount <= 0) return 0;
  return (currentIndex + 1) % slideCount;
}
