import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { passwordAuthError } from "./auth-errors";

describe("errores al entrar o crear cuenta con contraseña", () => {
  it("el límite de intentos se explica al usuario", () => {
    const e = passwordAuthError({ status: 429, code: "over_request_rate_limit" });
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).code).toBe("rate_limited");
  });

  it("credenciales erróneas dan un mensaje que no distingue correo de contraseña", () => {
    const e = passwordAuthError({ status: 400, code: "invalid_credentials", message: "Invalid login credentials" });
    expect(e.message).toBe("Correo o contraseña incorrectos.");
  });

  it("un correo ya registrado no se confirma con un mensaje de 'ya existe'", () => {
    const e = passwordAuthError({ status: 422, code: "user_already_exists" });
    expect(e.message).not.toMatch(/ya existe|registrado/i);
  });

  it("otros errores no revelan detalles", () => {
    const e = passwordAuthError({ status: 500, message: "Database error finding user" });
    expect(e).not.toBeInstanceOf(AppError);
    expect(e.message).not.toMatch(/user|Database/);
  });
});
