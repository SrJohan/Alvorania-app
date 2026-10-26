import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculate, emptyAnswers } from "@/lib/tax/engine";
import { rulesFromRows, type TaxRuleRow } from "@/lib/tax/load";
import { RULES_2025_DEMO } from "@/lib/tax/rules";
import { esc, renderEmail } from "./email";
import { answersDraftSchema, answersSchema, safeFileName, uploadSchema } from "./validation";

// Las filas del catálogo SQL se leen del propio archivo de migración: si divergen del motor, el test lo detecta.
function rowsFromCatalogMigration(reviewed: boolean): TaxRuleRow[] {
  const sql = fs.readFileSync(path.join(__dirname, "..", "..", "supabase", "migrations", "0002_catalog.sql"), "utf8");
  const block = sql.slice(sql.indexOf("insert into tax_rules"));
  const rows: TaxRuleRow[] = [];
  for (const m of block.matchAll(/\((\d{4}), '([A-Z]+)', '(\w+)', '(\w+)', '(\{.*?\})', '/g)) {
    rows.push({ tax_year: Number(m[1]), territory: m[2], kind: m[3], code: m[4], rule: JSON.parse(m[5]), reviewed_at: reviewed ? "2026-01-01" : null });
  }
  return rows;
}

describe("reglas fiscales desde la base de datos", () => {
  it("el catálogo SQL produce las mismas reglas que el motor de demostración", () => {
    const rows = rowsFromCatalogMigration(true);
    expect(rows).toHaveLength(5);
    const rules = rulesFromRows(rows, { requireReviewed: true });
    expect(rules).toMatchObject({
      minimoPersonal: RULES_2025_DEMO.minimoPersonal, minimoDescendientes: RULES_2025_DEMO.minimoDescendientes, minimoMenor3: RULES_2025_DEMO.minimoMenor3,
      gastosDeducibles: RULES_2025_DEMO.gastosDeducibles, limitePensiones: RULES_2025_DEMO.limitePensiones, donativo: RULES_2025_DEMO.donativo,
      hipotecaAnterior2013: RULES_2025_DEMO.hipotecaAnterior2013,
    });
    expect(rules.scale).toEqual(RULES_2025_DEMO.scale);
  });

  it("calcula igual con reglas de la base de datos que con las del código", () => {
    const answers = { ...emptyAnswers, ccaa: "Madrid", civilStatus: "soltero" as const, grossIncome: 32000, socialSecurity: 2080, withholdings: 4100, children: 1, childrenUnder3: 1, pensionContrib: 1200, donations: 100 };
    const fromDb = calculate(answers, rulesFromRows(rowsFromCatalogMigration(true), { requireReviewed: true }));
    const fromCode = calculate(answers);
    expect(fromDb.resultCents).toBe(fromCode.resultCents);
    expect(fromDb.resultCents).toBe(-4100); // caso comprobado a mano: a devolver 41,00 €
    expect(fromDb.savingsCents).toBe(44000);
  });

  it("se niega a usar reglas sin revisar cuando se exige revisión", () => {
    expect(() => rulesFromRows(rowsFromCatalogMigration(false), { requireReviewed: true })).toThrow(/revisadas/);
    expect(() => rulesFromRows(rowsFromCatalogMigration(false), { requireReviewed: false })).not.toThrow();
  });

  it("falla con un mensaje claro si falta una regla o no hay ninguna", () => {
    expect(() => rulesFromRows([], { requireReviewed: false })).toThrow(/No hay reglas/);
    expect(() => rulesFromRows(rowsFromCatalogMigration(true).slice(1), { requireReviewed: false })).toThrow(/Falta la regla/);
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
  it("escapa HTML en los datos del usuario", () => {
    expect(esc(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    const r = renderEmail("submitted", { name: `<img src=x onerror=alert(1)>`, reference: "<b>X</b>" });
    expect(r.html).not.toContain("<img");
    expect(r.html).not.toContain("<b>X</b>");
  });
  it("incluye texto plano y asunto en cada plantilla", () => {
    for (const k of ["payment_received", "advisor_approved", "submitted", "renewal_reminder", "nudge_unpaid", "nudge_approval", "account_deleted"] as const) {
      const r = renderEmail(k, { name: "Ana", invoice: "F-2026-000001", reference: "R1", renewsOn: "1 de enero", amount: "59 €" });
      expect(r.subject.length).toBeGreaterThan(5);
      expect(r.text.length).toBeGreaterThan(20);
    }
  });
});
