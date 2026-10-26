import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Postgres en memoria que imita lo que Supabase aporta: esquema auth, auth.uid() y los roles authenticated / service_role.
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADV = "00000000-0000-0000-0000-0000000000ad";
const OTHER_ADV = "00000000-0000-0000-0000-0000000000ae";
const ADMIN = "00000000-0000-0000-0000-0000000000ff";

let db: PGlite;

async function as(uid: string | null, fn: () => Promise<unknown>) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${uid ?? ""}', false)`);
  await db.exec(uid ? "set role authenticated" : "set role service_role");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

const q = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows as Record<string, unknown>[];

async function fails(promise: Promise<unknown>, match?: RegExp) {
  try {
    await promise;
  } catch (e) {
    if (match) expect(String((e as Error).message)).toMatch(match);
    return;
  }
  throw new Error("expected the statement to fail");
}

beforeAll(async () => {
  db = new PGlite({ extensions: { btree_gist } });
  await db.exec(`
    create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
  `);
  // Supabase concede estos privilegios por defecto a objetos nuevos en public; las migraciones revocan lo sensible.
  await db.exec(`
    grant usage on schema public to authenticated, anon, service_role;
    alter default privileges in schema public grant all on tables to authenticated, service_role;
    alter default privileges in schema public grant all on sequences to authenticated, service_role;
    alter default privileges in schema public grant all on functions to authenticated, anon, service_role;
  `);
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const [id, email] of [[A, "a@example.com"], [B, "b@example.com"], [ADV, "adv@example.com"], [OTHER_ADV, "adv2@example.com"], [ADMIN, "admin@example.com"]]) {
    await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  }
  await db.exec(`
    update profiles set role = 'advisor' where id in ('${ADV}', '${OTHER_ADV}');
    update profiles set role = 'admin' where id = '${ADMIN}';
  `);
});

describe("perfiles", () => {
  it("se crea un perfil al registrarse", async () => {
    expect((await q("select count(*)::int n from profiles"))[0].n).toBe(5);
  });
  it("un usuario no puede subirse el rol", async () => {
    await fails(as(A, () => db.exec(`update profiles set role = 'admin' where id = '${A}'`)), /protected/);
  });
  it("un usuario no ve el perfil de otro", async () => {
    const rows = await as(A, () => q("select id from profiles")) as { id: string }[];
    expect(rows.map((r) => r.id)).toEqual([A]);
  });
});

describe("aislamiento entre clientes", () => {
  let caseA: string;
  beforeAll(async () => {
    await as(A, async () => {
      const r = await q("insert into cases (user_id, case_type, tax_year) values ($1, 'renta', 2025) returning id", [A]);
      caseA = r[0].id as string;
    });
    await as(A, () => db.query("insert into messages (case_id, sender_id, sender_kind, body) values ($1, $2, 'user', 'hola')", [caseA, A]));
    await as(A, () => db.query("insert into documents (case_id, uploaded_by, kind, storage_path, mime, size_bytes) values ($1, $2, 'otro', 'x', 'application/pdf', 10)", [caseA, A]));
    await q("insert into payments (user_id, case_id, type, amount_cents, status) values ($1, $2, 'plan', 5900, 'succeeded')", [A, caseA]);
  });

  it("el dueño ve su caso", async () => {
    expect((await as(A, () => q("select id from cases")) as unknown[]).length).toBe(1);
  });
  it("otro cliente no ve casos, mensajes, documentos ni pagos ajenos", async () => {
    for (const t of ["cases", "messages", "documents", "payments", "questionnaire_answers", "tax_data", "calculations", "reviews"]) {
      expect((await as(B, () => q(`select * from ${t}`)) as unknown[]).length, t).toBe(0);
    }
  });
  it("otro cliente no puede escribir en un caso ajeno", async () => {
    await fails(as(B, () => db.query("insert into messages (case_id, sender_id, sender_kind, body) values ($1, $2, 'user', 'intruso')", [caseA, B])));
    await fails(as(B, () => db.query("insert into questionnaire_answers (case_id, answers) values ($1, '{}')", [caseA])));
  });
  it("no se puede crear un caso a nombre de otro", async () => {
    await fails(as(B, () => db.query("insert into cases (user_id, case_type, tax_year) values ($1, 'renta', 2024)", [A])));
  });
  it("el cliente no puede cambiar el estado de su caso ni asignarse asesor", async () => {
    const r = await as(A, () => db.query(`update cases set status = 'presentado' where id = $1`, [caseA])) as { affectedRows: number };
    expect(r.affectedRows).toBe(0);
    await fails(as(A, () => db.query("insert into cases (user_id, case_type, tax_year, advisor_id) values ($1, 'renta', 2023, $2)", [A, ADV])));
  });
  it("un cliente no escribe suscripciones, pagos ni eventos de Stripe", async () => {
    await fails(as(A, () => db.query("insert into payments (user_id, type, amount_cents, status) values ($1, 'plan', 1, 'succeeded')", [A])));
    await fails(as(A, () => db.query("insert into stripe_events (id, type, payload) values ('evt_x', 't', '{}')")));
    expect((await as(A, () => q("select * from stripe_events")) as unknown[]).length).toBe(0);
  });
  it("un cliente no puede pedir un número de factura", async () => {
    await fails(as(A, () => q("select next_invoice_number()")));
  });
  it("un caso vivo por usuario, tipo y año", async () => {
    await fails(as(A, () => db.query("insert into cases (user_id, case_type, tax_year) values ($1, 'renta', 2025)", [A])), /cases_one_active/);
  });

  describe("asesores", () => {
    it("un asesor sin asignar no ve el caso", async () => {
      expect((await as(ADV, () => q("select id from cases")) as unknown[]).length).toBe(0);
    });
    it("con el caso asignado lo ve, y otro asesor sigue sin verlo", async () => {
      await q("update cases set advisor_id = $1 where id = $2", [ADV, caseA]);
      expect((await as(ADV, () => q("select id from cases")) as unknown[]).length).toBe(1);
      expect((await as(OTHER_ADV, () => q("select id from cases")) as unknown[]).length).toBe(0);
      expect((await as(ADV, () => q("select id from messages")) as unknown[]).length).toBe(1);
      expect((await as(OTHER_ADV, () => q("select id from documents")) as unknown[]).length).toBe(0);
    });
    it("el admin lo ve todo", async () => {
      expect((await as(ADMIN, () => q("select id from cases")) as unknown[]).length).toBe(1);
    });
  });

  describe("presentación: dos aprobaciones y justificante", () => {
    it("no se presenta sin revisión", async () => {
      await fails(q(`update cases set status = 'presentado', aeat_reference = 'X' where id = $1`, [caseA]), /approval/);
    });
    it("el usuario no puede aprobar antes que el asesor", async () => {
      await fails(q("insert into reviews (case_id, advisor_id, user_approved_at) values ($1, $2, now())", [caseA, ADV]), /approval_order/);
    });
    it("con solo la aprobación del asesor tampoco", async () => {
      const r = await q("insert into reviews (case_id, advisor_id, advisor_approved_at) values ($1, $2, now()) returning id", [caseA, ADV]);
      await fails(q(`update cases set status = 'presentado', aeat_reference = 'X' where id = $1`, [caseA]), /approval/);
      await q("update reviews set user_approved_at = now() where id = $1", [r[0].id]);
    });
    it("con ambas aprobaciones hace falta el justificante", async () => {
      await fails(q(`update cases set status = 'presentado' where id = $1`, [caseA]), /aeat_reference/);
      await q(`update cases set status = 'presentado', aeat_reference = 'JUSTIF-1' where id = $1`, [caseA]);
      expect((await q("select submitted_at from cases where id = $1", [caseA]))[0].submitted_at).not.toBeNull();
    });
  });
});

describe("integridad", () => {
  it("dos reservas del mismo hueco son imposibles", async () => {
    await q("insert into advisor_slots (advisor_id, during) values ($1, tstzrange('2026-03-01 10:00+00', '2026-03-01 10:30+00'))", [ADV]);
    await fails(q("insert into advisor_slots (advisor_id, during) values ($1, tstzrange('2026-03-01 10:15+00', '2026-03-01 10:45+00'))", [ADV]), /no_overlap/);
    await q("insert into advisor_slots (advisor_id, during) values ($1, tstzrange('2026-03-01 10:30+00', '2026-03-01 11:00+00'))", [ADV]);
  });
  it("las facturas son correlativas y sin huecos", async () => {
    const a = (await q("select next_invoice_number() n"))[0].n as string;
    const b = (await q("select next_invoice_number() n"))[0].n as string;
    const num = (s: string) => Number(s.split("-")[2]);
    expect(num(b)).toBe(num(a) + 1);
    expect(a).toMatch(/^F-\d{4}-\d{6}$/);
  });
  it("el id de un evento de Stripe es único (idempotencia)", async () => {
    await q("insert into stripe_events (id, type, payload) values ('evt_1', 'x', '{}')");
    await fails(q("insert into stripe_events (id, type, payload) values ('evt_1', 'x', '{}')"), /duplicate|unique/);
  });
  it("el catálogo se carga y el paquete IRPF 2025 sustituye a las reglas de demostración, sin revisar", async () => {
    expect((await q("select count(*)::int n from plans"))[0].n).toBe(5);
    expect((await q("select count(*)::int n from tax_rules where tax_year = 2025"))[0].n).toBe(1);
    expect((await q("select count(*)::int n from tax_rules where kind = 'paquete' and reviewed_at is null"))[0].n).toBe(1);
    const pkg = (await q("select rule from tax_rules where kind = 'paquete'"))[0].rule as { territorios: Record<string, unknown> };
    expect(Object.keys(pkg.territorios).sort()).toEqual(["Andalucía", "Cataluña", "Madrid"]);
  });
  it("importes negativos y rangos de fechas inválidos se rechazan", async () => {
    await fails(q("insert into payments (user_id, type, amount_cents, status) values ($1, 'plan', -1, 'succeeded')", [A]));
  });
});

describe("operación", () => {
  it("el límite de uso bloquea al superar el máximo y se reinicia con la ventana", async () => {
    const hit = async () => (await q("select hit_rate_limit('login:ip:1.1.1.1', 3, 60) ok"))[0].ok;
    expect([await hit(), await hit(), await hit(), await hit()]).toEqual([true, true, true, false]);
    await q("update rate_limits set window_start = now() - interval '2 minutes' where key = 'login:ip:1.1.1.1'");
    expect(await hit()).toBe(true);
  });
  it("un cliente no puede tocar los límites ni asignar asesores", async () => {
    await fails(as(A, () => q("select hit_rate_limit('x', 1, 1)")));
    await fails(as(A, () => q("select pick_advisor()")));
    expect((await as(A, () => q("select * from rate_limits")) as unknown[]).length).toBe(0);
  });
  it("pick_advisor devuelve el asesor con menos casos abiertos", async () => {
    await q("insert into cases (user_id, advisor_id, case_type, tax_year, status) values ($1, $2, 'renta', 2025, 'en_revision')", [B, ADV]);
    const id = (await q("select pick_advisor() id"))[0].id;
    expect(id).toBe(OTHER_ADV);
  });
});

describe("F2 · continuidad del asesor entre años", () => {
  const D = "00000000-0000-0000-0000-00000000000d";
  beforeAll(async () => {
    await db.query("insert into auth.users (id, email) values ($1, 'd@example.com')", [D]);
  });

  it("un cliente que ya tuvo asesor vuelve con el mismo, aunque haya otro menos cargado", async () => {
    // A tuvo su caso de 2025 con ADV (presentado). ADV además tiene casos abiertos y OTHER_ADV ninguno.
    expect((await q("select pick_advisor($1) id", [A]))[0].id).toBe(ADV);
  });

  it("un cliente nuevo va al asesor con menos casos abiertos", async () => {
    expect((await q("select pick_advisor($1) id", [D]))[0].id).toBe(OTHER_ADV);
  });

  it("si el asesor anterior ya no está, se asigna por carga", async () => {
    await q("update profiles set deleted_at = now() where id = $1", [ADV]);
    expect((await q("select pick_advisor($1) id", [A]))[0].id).toBe(OTHER_ADV);
    await q("update profiles set deleted_at = null where id = $1", [ADV]);
  });

  it("la versión sin argumentos sigue funcionando y los clientes no pueden llamarla", async () => {
    expect((await q("select pick_advisor() id"))[0].id).toBe(OTHER_ADV);
    await fails(as(A, () => q("select pick_advisor($1)", [A])));
  });
});
