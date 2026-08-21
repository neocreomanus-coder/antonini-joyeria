import { describe, expect, it } from "vitest";
import { parseJsonColumn } from "./db";

describe("parseJsonColumn", () => {
  it("conserva los valores JSON que el driver ya devuelve como objetos", () => {
    const address = { name: "María García", city: "Bogotá" };
    expect(parseJsonColumn(address)).toEqual(address);
  });

  it("deserializa cadenas JSON sin afectar el formato anterior", () => {
    expect(parseJsonColumn('{"name":"María García","city":"Bogotá"}')).toEqual({
      name: "María García",
      city: "Bogotá",
    });
  });

  it("evita que un valor JSON no válido bloquee el listado administrativo", () => {
    expect(parseJsonColumn("[object Object]")).toBeNull();
  });
});
