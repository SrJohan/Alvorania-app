-- Catálogo inicial. PRECIOS DE EJEMPLO: se fijan de verdad en /replica-launch.
-- stripe_price_id se rellena después de crear los productos en Stripe (modo test primero).
insert into plans (code, name, price_cents, period, min_commitment_months, features) values
  ('PRO',  'Esencial',   2900,  'year',  0, '{"chat": false}'),
  ('LIVE', 'Acompañado', 5900,  'year',  0, '{"chat": true}'),
  ('FULL', 'Completo',   11900, 'year',  0, '{"chat": true, "inversiones": true}'),
  ('STANDARD', 'Estándar', 2990, 'month', 3, '{"modelos": ["130","303"]}'),
  ('PREMIUM',  'Premium',  5990, 'month', 3, '{"contabilidad": true}')
on conflict (code) do nothing;

insert into services (code, name, case_type, price_cents, price_max_cents, success_fee_bps) values
  ('requerimiento_analisis', 'Análisis de una carta de Hacienda', 'requerimiento', 0, null, null),
  ('requerimiento_basico', 'Respuesta a un requerimiento básico', 'requerimiento', 5000, null, null),
  ('requerimiento_complejo', 'Respuesta a un requerimiento complejo', 'requerimiento', 23900, null, null),
  ('rectificativa_ejercicio', 'Revisión de un ejercicio anterior', 'rectificativa', 1000, null, 2000)
on conflict (code) do nothing;

-- Reglas del IRPF 2025 de DEMOSTRACIÓN. reviewed_at queda nulo: el servidor se niega a usarlas en producción
-- hasta que un fiscalista las revise y las firme (ver REQUIRE_REVIEWED_TAX_RULES).
insert into tax_rules (tax_year, territory, kind, code, rule, source_url) values
  (2025, 'ESTATAL', 'tramos', 'escala_general_combinada', '{"brackets":[{"upTo":12450,"rate":0.19},{"upTo":20200,"rate":0.24},{"upTo":35200,"rate":0.30},{"upTo":60000,"rate":0.37},{"upTo":300000,"rate":0.45},{"upTo":null,"rate":0.47}]}', 'https://sede.agenciatributaria.gob.es/'),
  (2025, 'ESTATAL', 'minimos', 'minimos_personales', '{"personal":5550,"descendientes":[2400,2700,4000,4500],"menor3":2800,"gastosDeducibles":2000}', 'https://sede.agenciatributaria.gob.es/'),
  (2025, 'ESTATAL', 'limite', 'pensiones', '{"limite":1500}', 'https://sede.agenciatributaria.gob.es/'),
  (2025, 'ESTATAL', 'deduccion', 'donativos', '{"firstTier":250,"firstRate":0.8,"restRate":0.4}', 'https://sede.agenciatributaria.gob.es/'),
  (2025, 'ESTATAL', 'deduccion', 'hipoteca_anterior_2013', '{"rate":0.15,"maxBase":9040}', 'https://sede.agenciatributaria.gob.es/')
on conflict (tax_year, territory, kind, code) do nothing;
