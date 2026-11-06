import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculate, emptyAnswers } from "@/lib/tax/engine";
import { rulesFromRows, type TaxRuleRow } from "@/lib/tax/load";
import { RULES_2025 } from "@/lib/tax/rules";
import { esc, renderEmail } from "./email";
import { answersDraftSchema, answersSchema, safeFileName, uploadSchema } from "./validation";

// El paquete de la migración 0012 (el último, que sustituye al de 0005) se lee del propio SQL: si diverge del JSON del motor, la prueba lo detecta.
function packageFromMigration(reviewed: boolean): TaxRuleRow[] {
  const sql = fs.readFileSync(path.join(__dirname, "..", "..", "supabase", "migrations", "0012_irpf_2025_comunidades.sql"), "utf8");
  const m = sql.match(/'(\{[\s\S]*\})'::jsonb/);
  if (!m) throw new Error("no se encontró el paquete en la migración");
  const rule = JSON.parse(m[1].replace(/''/g, "'"));
  return [{ tax_year: 2025, territory: "COMUN", kind: "paquete", code: "irpf", rule, reviewed_at: reviewed ? "2026-01-01" : null }];
}

describe("reglas fiscales desde la base de datos", () => {
  it("la migración contiene exactamente el paquete del motor", () => {
    expect(rulesFromRows(packageFromMigration(true), { requireReviewed: true })).toEqual(RULES_2025);
  });

  it("calcula igual con reglas de la base de datos que con las del código", () => {
    const answers = { ...emptyAnswers, ccaa: "Madrid", civilStatus: "soltero" as const, birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000 };
    const fromDb = calculate(answers, rulesFromRows(packageFromMigration(true), { requireReviewed: true }));
    expect(fromDb.resultCents).toBe(calculate(answers).resultCents);
    expect(fromDb.resultCents).toBe(59802); // caso A de engine.test.ts, calculado a mano
  });

  it("se niega a usar reglas sin revisar cuando se exige revisión", () => {
    expect(() => rulesFromRows(packageFromMigration(false), { requireReviewed: true })).toThrow(/revisadas/);
    expect(() => rulesFromRows(packageFromMigration(false), { requireReviewed: false })).not.toThrow();
  });

  it("falla con un mensaje claro si no hay paquete", () => {
    expect(() => rulesFromRows([], { requireReviewed: false })).toThrow(/No hay reglas/);
  });
});

describe("validación de entradas", () => {
  const ok = { ...emptyAnswers, ccaa: "Madrid", civilStatus: "soltero", grossIncome: 30000 };

  it("acepta respuestas válidas", () => {
    expect(answersSchema.safeParse(ok).success).toBe(true);
  });
  it("rechaza comunidades inventadas, importes negativos y valores absurdos", () => {
    expect(answersDraftSchema.safeParse({ ...ok, ccaa: "Narnia" }).success).toBe(false);
    expect(answersDraftSchema.safeParse({ ...ok, grossIncome: -1 }).success).toBe(false);
    expect(answersDraftSchema.safeParse({ ...ok, grossIncome: 1e12 }).success).toBe(false);
    expect(answersDraftSchema.safeParse({ ...ok, grossIncome: Number.NaN }).success).toBe(false);
    expect(answersDraftSchema.safeParse({ ...ok, children: 1.5 }).success).toBe(false);
  });
  it("el borrador admite incoherencias transitorias pero el cálculo no", () => {
    const incoherent = { ...ok, children: 1, childrenUnder3: 2 };
    expect(answersDraftSchema.safeParse(incoherent).success).toBe(true);
    expect(answersSchema.safeParse(incoherent).success).toBe(false);
    expect(answersSchema.safeParse({ ...ok, withholdings: 99999 }).success).toBe(false);
    expect(answersSchema.safeParse({ ...ok, ascendientes: 1, ascendientes75: 2 }).success).toBe(false);
    expect(answersSchema.safeParse({ ...ok, ascendientes: 2, ascendientes75: 1 }).success).toBe(true);
  });
  it("limita tipo y tamaño de los archivos subidos", () => {
    const base = { name: "carta.pdf", mime: "application/pdf", sizeBytes: 1000, kind: "carta_hacienda" };
    expect(uploadSchema.safeParse(base).success).toBe(true);
    expect(uploadSchema.safeParse({ ...base, mime: "application/x-msdownload" }).success).toBe(false);
    expect(uploadSchema.safeParse({ ...base, sizeBytes: 21 * 1024 * 1024 }).success).toBe(false);
    expect(uploadSchema.safeParse({ ...base, sizeBytes: 0 }).success).toBe(false);
  });
  it("el nombre de archivo no puede escapar de su carpeta", () => {
    expect(safeFileName("../../etc/passwd")).not.toContain("/");
    expect(safeFileName("..\\..\\boot.ini")).not.toContain("\\");
    expect(safeFileName("...")).toBe("documento");
    expect(safeFileName("Carta Hacienda ñ.pdf")).toBe("Carta-Hacienda-n.pdf");
    expect(safeFileName("a".repeat(500) + ".pdf").length).toBeLessThanOrEqual(100);
  });
});

describe("correos", () => {
  it("la nota del asesor se escapa en el correo de cambios pedidos", () => {
    const r = renderEmail("changes_requested", { name: "Ana", notes: "<script>x</script> falta el certificado" });
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("falta el certificado");
    expect(r.text).toContain("falta el certificado");
  });

  it("escapa HTML en los datos del usuario", () => {
    expect(esc(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    const r = renderEmail("submitted", { name: `<img src=x onerror=alert(1)>`, reference: "<b>X</b>" });
    expect(r.html).not.toContain("<img");
    expect(r.html).not.toContain("<b>X</b>");
  });
  it("incluye texto plano y asunto en cada plantilla", () => {
    for (const k of ["payment_received", "advisor_approved", "submitted", "renewal_reminder", "nudge_unpaid", "nudge_approval", "account_deleted", "changes_requested"] as const) {
      const r = renderEmail(k, { name: "Ana", invoice: "F-2026-000001", reference: "R1", renewsOn: "1 de enero", amount: "59 €" });
      expect(r.subject.length).toBeGreaterThan(5);
      expect(r.text.length).toBeGreaterThan(20);
    }
  });
});
