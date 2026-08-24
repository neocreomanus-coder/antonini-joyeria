import { CHANGES_AND_RETURNS_CONTENT } from "./changesAndReturnsContent";
import { SHIPPING_POLICY_CONTENT } from "./shippingPolicyContent";
import { TERMS_AND_CONDITIONS_CONTENT } from "./termsAndConditionsContent";

export type InstitutionalPageKey =
  | "quienes-somos"
  | "terminos-y-condiciones"
  | "cambios-y-devoluciones"
  | "politica-de-envios";

type InstitutionalSection = {
  title: string;
  paragraphs: string[];
};

export type InstitutionalPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InstitutionalSection[];
  lastUpdated?: string;
};

export const INSTITUTIONAL_PATHS: Record<InstitutionalPageKey, string> = {
  "quienes-somos": "/quienes-somos",
  "terminos-y-condiciones": "/terminos-y-condiciones",
  "cambios-y-devoluciones": "/cambios-y-devoluciones",
  "politica-de-envios": "/politica-de-envios",
};

export const INSTITUTIONAL_CONTENT: Record<InstitutionalPageKey, InstitutionalPageContent> = {
  "quienes-somos": {
    eyebrow: "Antonini Joyería",
    title: "Quiénes somos",
    intro: "Creamos y seleccionamos joyas y accesorios para acompañar momentos especiales, con atención personalizada desde Colombia para todo el país.",
    sections: [
      {
        title: "Nuestra esencia",
        paragraphs: [
          "Antonini Joyería reúne diseño, detalle y acompañamiento cercano para que cada cliente encuentre una pieza que represente su estilo.",
          "Trabajamos con una selección de joyería y perfumería, cuidando la presentación de cada pedido y la claridad durante la compra.",
        ],
      },
      {
        title: "Compra acompañada",
        paragraphs: [
          "Nuestro equipo está disponible para resolver inquietudes sobre materiales, referencias, tallas, disponibilidad y proceso de despacho antes de confirmar la compra.",
          "Realizamos envíos nacionales y compartimos la información de seguimiento cuando el pedido recibe su guía de transporte.",
        ],
      },
    ],
  },
  "terminos-y-condiciones": TERMS_AND_CONDITIONS_CONTENT,
  "cambios-y-devoluciones": CHANGES_AND_RETURNS_CONTENT,
  "politica-de-envios": SHIPPING_POLICY_CONTENT,
};

export function getInstitutionalPage(key: InstitutionalPageKey) {
  return INSTITUTIONAL_CONTENT[key];
}
