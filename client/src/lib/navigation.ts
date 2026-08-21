export function catalogPath(slug?: string) {
  return slug ? `/catalogo/${slug}` : "/catalogo";
}

export function scrollToPageTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}
