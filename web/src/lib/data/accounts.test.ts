import { describe, expect, it } from "vitest";
import { accounts } from "./accounts";

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), raw: () => [...m.values()].join("") };
};

describe("cuentas de la demo", () => {
  it("registra, entra con la contraseña correcta y rechaza la incorrecta", async () => {
    const a = accounts(memory());
    expect(await a.register("Ana@Example.test", "Ana Prueba", "una-clave-larga")).toBe(true);
    expect(await a.verify("ana@example.test ", "una-clave-larga")).toBe("Ana Prueba");
    expect(await a.verify("ana@example.test", "otra-clave")).toBeNull();
    expect(await a.verify("nadie@example.test", "una-clave-larga")).toBeNull();
  });

  it("no permite crear dos cuentas con el mismo correo", async () => {
    const a = accounts(memory());
    await a.register("ana@example.test", "Ana", "una-clave-larga");
    expect(await a.register("ANA@example.test", "Otra", "clave-distinta")).toBe(false);
    expect(await a.verify("ana@example.test", "una-clave-larga")).toBe("Ana");
  });

  it("no guarda la contraseña en claro", async () => {
    const store = memory();
    await accounts(store).register("ana@example.test", "Ana", "una-clave-larga");
    expect(store.raw()).not.toContain("una-clave-larga");
  });

  it("cambia la contraseña: la antigua deja de valer y la nueva entra", async () => {
    const a = accounts(memory());
    await a.register("ana@example.test", "Ana", "una-clave-larga");
    expect(a.has("ANA@example.test")).toBe(true);
    expect(await a.setPassword("ana@example.test", "clave-nueva-1")).toBe("Ana");
    expect(await a.verify("ana@example.test", "una-clave-larga")).toBeNull();
    expect(await a.verify("ana@example.test", "clave-nueva-1")).toBe("Ana");
    expect(await a.setPassword("nadie@example.test", "clave-nueva-1")).toBeNull();
  });
});
