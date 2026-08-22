import type { Express } from "express";
import * as db from "./db";

export const SITE_URL = "https://antoninijoyeriacol.com";
export const SITE_NAME = "Antonini Joyería";

const DEFAULT_TITLE = "Antonini Joyería | Oro 18K Certificado";
const DEFAULT_DESCRIPTION =
  "Fabricantes y exportadores de joyería en oro 18K. Cadenas, anillos, pulseras y más. Envíos a todo Colombia con pago al recibir.";

const DEFAULT_IMAGE =
  `${SITE_URL}/manus-storage/antonini-logo-v3_d35b56de.png`;

const INDEX_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export type SeoMeta = {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "product";
  robots: string;
  statusCode?: number;
  jsonLd?: unknown;
};

function absoluteUrl(value?: string | null): string {
  if (!value) return DEFAULT_IMAGE;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function cleanDescription(
  value: unknown,
  fallback: string,
): string {
  const text =
    typeof value === "string"
      ? value
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  const result = text || fallback;

  if (result.length <= 160) {
    return result;
  }

  return `${result.slice(0, 157).trim()}...`;
}

function noIndex(
  title = DEFAULT_TITLE,
  statusCode = 200,
): SeoMeta {
  return {
    title,
    description: DEFAULT_DESCRIPTION,
    robots: "noindex,nofollow",
    type: "website",
    statusCode,
  };
}

export async function getSeoMeta(
  pathname: string,
): Promise<SeoMeta> {
  const pathnameOnly = pathname.split("?")[0] || "/";

  // ── Inicio ────────────────────────────────────────────────────────────────
  if (pathnameOnly === "/") {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonical: SITE_URL,
      image: DEFAULT_IMAGE,
      type: "website",
      robots: INDEX_ROBOTS,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: {
              "@type": "ImageObject",
              url: DEFAULT_IMAGE,
            },
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_NAME,
            publisher: {
              "@id": `${SITE_URL}/#organization`,
            },
            inLanguage: "es-CO",
          },
        ],
      },
    };
  }

  // ── Catálogo general ─────────────────────────────────────────────────────
  if (
    pathnameOnly === "/catalogo" ||
    pathnameOnly === "/catalogo/"
  ) {
    const canonical = `${SITE_URL}/catalogo`;

    return {
      title: "Catálogo de Joyería | Antonini Joyería",
      description:
        "Explora el catálogo de Antonini Joyería. Descubre cadenas, anillos, pulseras y más con envíos a todo Colombia y pago al recibir.",
      canonical,
      image: DEFAULT_IMAGE,
      type: "website",
      robots: INDEX_ROBOTS,
    };
  }

  // ── Categorías ────────────────────────────────────────────────────────────
  const categoryMatch =
    pathnameOnly.match(/^\/catalogo\/([^/]+)\/?$/);

  if (categoryMatch) {
    let slug: string;

    try {
      slug = decodeURIComponent(categoryMatch[1]);
    } catch {
      return noIndex(
        "Categoría no encontrada | Antonini Joyería",
        404,
      );
    }

    const category = await db.getCategoryBySlug(slug);

    if (!category || category.active === false) {
      return noIndex(
        "Categoría no encontrada | Antonini Joyería",
        404,
      );
    }

    const canonical =
      `${SITE_URL}/catalogo/${encodeURIComponent(category.slug)}`;

    const description = cleanDescription(
      category.description,
      `Descubre ${category.name} en Antonini Joyería. Compra online con envíos a todo Colombia y pago al recibir.`,
    );

    return {
      title: `${category.name} | Antonini Joyería`,
      description,
      canonical,
      image: absoluteUrl(category.imageUrl),
      type: "website",
      robots: INDEX_ROBOTS,
    };
  }

  // ── Producto individual ──────────────────────────────────────────────────
  const productMatch =
    pathnameOnly.match(/^\/producto\/([^/]+)\/?$/);

  if (productMatch) {
    let slug: string;

    try {
      slug = decodeURIComponent(productMatch[1]);
    } catch {
      return noIndex(
        "Producto no encontrado | Antonini Joyería",
        404,
      );
    }

    const product = await db.getProductBySlug(slug);

    if (!product || product.active === false) {
      return noIndex(
        "Producto no encontrado | Antonini Joyería",
        404,
      );
    }

    const canonical =
      `${SITE_URL}/producto/${encodeURIComponent(product.slug)}`;

    const description = cleanDescription(
      product.description,
      `Compra ${product.name} en Antonini Joyería. Envíos a todo Colombia y pago al recibir.`,
    );

    const images =
      Array.isArray(product.imageUrls) &&
      product.imageUrls.length > 0
        ? product.imageUrls.map(absoluteUrl)
        : [DEFAULT_IMAGE];

    const numericPrice = Number(product.basePrice);

    const price =
      Number.isFinite(numericPrice)
        ? numericPrice.toFixed(2)
        : String(product.basePrice);

    const availability =
      product.stock === 0
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock";

    return {
      title: `${product.name} | Antonini Joyería`,
      description,
      canonical,
      image: images[0],
      type: "product",
      robots: INDEX_ROBOTS,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description,
        image: images,
        sku: String(product.id),
        url: canonical,
        brand: {
          "@type": "Brand",
          name: SITE_NAME,
        },
        ...(product.categoryName
          ? { category: product.categoryName }
          : {}),
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "COP",
          price,
          availability,
          itemCondition:
            "https://schema.org/NewCondition",
        },
      },
    };
  }

  // ── Páginas privadas/transaccionales ─────────────────────────────────────
  if (
    /^\/admin(?:\/|$)/.test(pathnameOnly) ||
    /^\/checkout\/?$/.test(pathnameOnly) ||
    /^\/pago(?:\/|$)/.test(pathnameOnly) ||
    /^\/pedido-confirmado(?:\/|$)/.test(pathnameOnly) ||
    /^\/rastrear-pedido\/?$/.test(pathnameOnly)
  ) {
    return noIndex();
  }

  if (pathnameOnly === "/404") {
    return noIndex(
      "Página no encontrada | Antonini Joyería",
      404,
    );
  }

  // Cualquier ruta desconocida será un 404 real para buscadores.
  return noIndex(
    "Página no encontrada | Antonini Joyería",
    404,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function applySeoToHtml(
  originalHtml: string,
  seo: SeoMeta,
): string {
  let html = originalHtml;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`,
  );

  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(
      seo.description,
    )}" />`,
  );

  const tags: string[] = [];

  tags.push(
    `<meta name="robots" content="${escapeHtml(
      seo.robots,
    )}" />`,
  );

  if (seo.canonical) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(
        seo.canonical,
      )}" />`,
    );
  }

  if (seo.canonical && seo.image) {
    tags.push(
      `<meta property="og:locale" content="es_CO" />`,
      `<meta property="og:site_name" content="${SITE_NAME}" />`,
      `<meta property="og:type" content="${seo.type ?? "website"}" />`,
      `<meta property="og:title" content="${escapeHtml(
        seo.title,
      )}" />`,
      `<meta property="og:description" content="${escapeHtml(
        seo.description,
      )}" />`,
      `<meta property="og:url" content="${escapeHtml(
        seo.canonical,
      )}" />`,
      `<meta property="og:image" content="${escapeHtml(
        seo.image,
      )}" />`,
      `<meta property="og:image:alt" content="${escapeHtml(
        seo.title,
      )}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(
        seo.title,
      )}" />`,
      `<meta name="twitter:description" content="${escapeHtml(
        seo.description,
      )}" />`,
      `<meta name="twitter:image" content="${escapeHtml(
        seo.image,
      )}" />`,
    );
  }

  if (seo.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${safeJsonLd(
        seo.jsonLd,
      )}</script>`,
    );
  }

  return html.replace(
    "</head>",
    `    ${tags.join("\n    ")}\n  </head>`,
  );
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function isoDate(value: unknown): string | null {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    const body = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /api/",
      "Disallow: /checkout",
      "Disallow: /pago/",
      "Disallow: /pedido-confirmado/",
      "Disallow: /rastrear-pedido",
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
    ].join("\n");

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8",
    );
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600",
    );
    res.status(200).send(body);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const [categories, products] = await Promise.all([
        db.getCategories(),
        db.getProducts({ limit: 1000 }),
      ]);

      const urls: Array<{
        loc: string;
        lastmod?: string | null;
      }> = [
        { loc: SITE_URL },
        { loc: `${SITE_URL}/catalogo` },
      ];

      for (const category of categories) {
        urls.push({
          loc:
            `${SITE_URL}/catalogo/` +
            encodeURIComponent(category.slug),
          lastmod: isoDate(
            (category as any).updatedAt,
          ),
        });
      }

      for (const product of products) {
        urls.push({
          loc:
            `${SITE_URL}/producto/` +
            encodeURIComponent(product.slug),
          lastmod: isoDate(product.updatedAt),
        });
      }

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
          .map(({ loc, lastmod }) => {
            const parts = [
              "  <url>",
              `    <loc>${escapeXml(loc)}</loc>`,
            ];

            if (lastmod) {
              parts.push(
                `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
              );
            }

            parts.push("  </url>");

            return parts.join("\n");
          })
          .join("\n") +
        `\n</urlset>\n`;

      res.setHeader(
        "Content-Type",
        "application/xml; charset=utf-8",
      );
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600",
      );

      res.status(200).send(xml);
    } catch (error) {
      console.error("[seo] sitemap error:", error);
      res.status(500).send("Error generando sitemap");
    }
  });
}
