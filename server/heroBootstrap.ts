import { getHeroConfig } from "./db";

/** Embed the current hero URLs in the first HTML response on the homepage. */
export async function injectHeroBootstrap(html: string, rawUrl: string): Promise<string> {
  const pathname = rawUrl.split("?", 1)[0];
  if (pathname !== "/") return html;
  try {
    const hero = await getHeroConfig();
    const media = { videoUrl: hero.videoUrl ?? null, posterUrl: hero.posterUrl ?? null };
    // Safely encode JSON inside a script without allowing HTML/script injection.
    const json = JSON.stringify(media).replace(/[<>&\u2028\u2029]/g, char => {
      const code = char.charCodeAt(0).toString(16).padStart(4, "0");
      return `\\u${code}`;
    });
    const script = `<script>window.__ANTONINI_HERO_MEDIA__=${json};</script>`;
    const url = media.posterUrl;
    const safePoster = typeof url === "string" && /^\/manus-storage\/[a-zA-Z0-9_./-]+$/.test(url);
    const preload = safePoster ? `<link rel="preload" as="image" href="${url}" fetchpriority="high" />` : "";
    return html.replace("</head>", `${preload}${script}</head>`);
  } catch (error) {
    console.error("[hero-bootstrap] Error consultando el video:", error);
    return html;
  }
}
