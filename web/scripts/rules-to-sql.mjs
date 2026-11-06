// Genera la migración con el paquete de reglas del IRPF a partir del JSON (única fuente de verdad).
// Uso: node scripts/rules-to-sql.mjs 2025 0005
import fs from "node:fs";

const [year = "2025", num = "0005"] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(`src/lib/tax/data/irpf-${year}.json`, "utf8"));
const json = JSON.stringify(pkg).replace(/'/g, "''");

const sql = `-- GENERADO por scripts/rules-to-sql.mjs desde src/lib/tax/data/irpf-${year}.json. No editar a mano.
-- Paquete completo de reglas del IRPF ${year}: escalas estatal y autonómicas de todas las comunidades de territorio común, mínimos,
-- reducciones y deducciones, con la URL oficial de cada cifra en "sources".
-- reviewed_at queda nulo: con REQUIRE_REVIEWED_TAX_RULES=true el servidor no calcula hasta que un fiscalista lo firme:
--   update tax_rules set reviewed_by = '<uuid del fiscalista>', reviewed_at = now() where tax_year = ${year} and kind = 'paquete';

alter table tax_rules drop constraint if exists tax_rules_kind_check;
alter table tax_rules add constraint tax_rules_kind_check check (kind in ('tramos','minimos','deduccion','reduccion','limite','paquete'));

-- Las filas sueltas de demostración del mismo ejercicio quedan sustituidas por el paquete.
delete from tax_rules where tax_year = ${year} and kind <> 'paquete';

insert into tax_rules (tax_year, territory, kind, code, rule, source_url)
values (${year}, 'COMUN', 'paquete', 'irpf', '${json}'::jsonb, 'https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Manual/100.html')
on conflict (tax_year, territory, kind, code) do update set rule = excluded.rule, reviewed_at = null, reviewed_by = null;
`;
const out = `supabase/migrations/${num}_irpf_${year}.sql`;
fs.writeFileSync(out, sql);
console.log(`escrito ${out} (${sql.length} bytes)`);
