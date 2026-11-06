import { describe, expect, it } from "vitest";
import { cleanId, isValidNif, isValidReferencia } from "./aeat";

describe("isValidNif", () => {
  it("acepta DNI y NIE con letra correcta", () => {
    expect(isValidNif("12345678Z")).toBe(true);
    expect(isValidNif("12345678-z")).toBe(true);
    expect(isValidNif("X1234567L")).toBe(true);
  });
  it("rechaza letra mala o formato raro", () => {
    expect(isValidNif("12345678A")).toBe(false);
    expect(isValidNif("1234567Z")).toBe(false);
    expect(isValidNif("")).toBe(false);
  });
});

describe("isValidReferencia", () => {
  it("acepta el formato del ejemplo y normaliza", () => {
    expect(isValidReferencia("QBW2X9")).toBe(true);
    expect(cleanId(" qbw 2x9 ")).toBe("QBW2X9");
    expect(isValidReferencia("qbw2x9")).toBe(true);
  });
  it("rechaza cortas o con símbolos", () => {
    expect(isValidReferencia("QBW2")).toBe(false);
    expect(isValidReferencia("QBW2X9!")).toBe(false);
  });
});
