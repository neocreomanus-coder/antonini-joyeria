import { describe, expect, it } from "vitest";
import { COLOMBIA_DEPARTMENTS, OTHER_CITY_VALUE, WORLD_COUNTRIES, formatShippingAddress, getColombianCities, isColombia } from "./shippingAddress";

describe("datos de dirección de envío", () => {
  it("deja Colombia disponible como país y cuenta con cobertura internacional", () => {
    expect(WORLD_COUNTRIES).toContain("Colombia");
    expect(WORLD_COUNTRIES).toContain("Estados Unidos");
    expect(WORLD_COUNTRIES).toContain("España");
    expect(WORLD_COUNTRIES.length).toBeGreaterThan(190);
  });

  it("ofrece los departamentos y ciudades frecuentes de Colombia", () => {
    expect(COLOMBIA_DEPARTMENTS).toContain("Antioquia");
    expect(COLOMBIA_DEPARTMENTS).toContain("Bogotá D.C.");
    expect(getColombianCities("Antioquia")).toContain("Medellín");
    expect(getColombianCities("Cundinamarca")).toContain("Soacha");
  });

  it("permite una ciudad manual cuando no está en la lista", () => {
    expect(OTHER_CITY_VALUE).toBe("__other_city__");
    expect(getColombianCities("Departamento inexistente")).toEqual([]);
  });

  it("identifica el formulario colombiano", () => {
    expect(isColombia("Colombia")).toBe(true);
    expect(isColombia("México")).toBe(false);
  });

  it("conserva país, región y código postal al mostrar direcciones", () => {
    expect(formatShippingAddress({
      address: "500 Fifth Avenue",
      city: "New York",
      stateProvince: "New York",
      postalCode: "10018",
      country: "Estados Unidos",
    })).toBe("500 Fifth Avenue, New York, New York, 10018, Estados Unidos");
  });
});
