export function getGalleryImageIndex(currentIndex: number, imageCount: number, direction: "previous" | "next") {
  if (imageCount <= 0) return 0;
  const normalizedIndex = ((currentIndex % imageCount) + imageCount) % imageCount;
  return direction === "next"
    ? (normalizedIndex + 1) % imageCount
    : (normalizedIndex - 1 + imageCount) % imageCount;
}

export function getGallerySwipeDirection(startX: number, endX: number, threshold = 40) {
  const distance = endX - startX;
  if (Math.abs(distance) < threshold) return null;
  return distance < 0 ? "next" : "previous";
}
