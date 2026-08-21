import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogPath, scrollToPageTop } from "./navigation";

describe("navigation helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates path-based catalog links for each category", () => {
    expect(catalogPath("cadenas")).toBe("/catalogo/cadenas");
    expect(catalogPath("perfumeria")).toBe("/catalogo/perfumeria");
    expect(catalogPath()).toBe("/catalogo");
  });

  it("returns the visitor to the top after a route change", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });

    scrollToPageTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });
});
