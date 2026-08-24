import { describe, expect, it } from "vitest";
import { getInstitutionalPage, INSTITUTIONAL_PATHS } from "./institutionalContent";

describe("contenido institucional", () => {
  it("define las rutas institucionales y la política de envíos", () => {
    expect(INSTITUTIONAL_PATHS).toEqual({
      "quienes-somos": "/quienes-somos",
      "terminos-y-condiciones": "/terminos-y-condiciones",
      "cambios-y-devoluciones": "/cambios-y-devoluciones",
      "politica-de-envios": "/politica-de-envios",
    });
  });

  it("carga los documentos publicados en sus páginas correspondientes", () => {
    expect(getInstitutionalPage("terminos-y-condiciones").sections).toHaveLength(18);
    expect(getInstitutionalPage("cambios-y-devoluciones").sections).toHaveLength(24);
    expect(getInstitutionalPage("politica-de-envios").sections).toHaveLength(12);
    expect(getInstitutionalPage("terminos-y-condiciones").lastUpdated).toBe("24 de agosto de 2026");
  });
});
