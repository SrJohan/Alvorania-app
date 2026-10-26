import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { magicLinkError } from "./auth-errors";

describe("errores al pedir el enlace de acceso (BUG-004)", () => {
  it("el límite de envío de Supabase se explica al usuario", () => {
    const e = magicLinkError({ status: 429, code: "over_email_send_rate_limit", message: "email rate limit exceeded" });
    expect(e).toBeInstanceOf(AppError);
    expect(e.message).toMatch(/espera unos minutos/i);
    expect((e as AppError).code).toBe("rate_limited");
  });

  it("también lo reconoce solo por el estado 429", () => {
    expect((magicLinkError({ status: 429, message: "Too many requests" }) as AppError).code).toBe("rate_limited");
  });

  it("otros errores no revelan detalles (ni si la cuenta existe)", () => {
    const e = magicLinkError({ status: 500, message: "Database error finding user" });
    expect(e).not.toBeInstanceOf(AppError);
    expect(e.message).not.toMatch(/user|Database/);
  });
});
