-- ===== migrations/0001_init.sql =====
-- Gestoría online (réplica del núcleo de TaxDown). Postgres 15+ (Supabase).
-- Alcance L: cálculo + revisión humana + presentación por tu equipo. Sin IA, sin conexión automática a AEAT.
-- Convenciones: uuid pk, timestamptz UTC, dinero en céntimos enteros + currency, RLS en todas las tablas.

create extension if not exists btree_gist;

-- ---------- helpers de acceso ----------
-- Roles: client | advisor | admin. Se guardan en profiles.role (no editable por el cliente, ver políticas).

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','advisor','admin')),
  email text not null unique,
  full_name text,
  nif text,                       -- cifrar en columna (pgsodium/vault) o app-level; ver architecture.md
  phone text,
  ccaa text,                      -- comunidad autónoma de residencia fiscal (clave para reglas y régimen foral)
  colegiado_no text,              -- solo advisors
  stripe_customer_id text unique,
  locale text not null default 'es-ES',
  deleted_at timestamptz,         -- soft delete previo al borrado RGPD diferido
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (role);

create function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('advisor','admin'));
$$;
create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------- consentimientos RGPD ----------
create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('terms','privacy','aeat_data_access','marketing','mandate_presentacion')),
  version text not null,
  granted boolean not null,
  ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on consents (user_id, kind, created_at desc);

-- ---------- catálogo ----------
create table plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('PRO','LIVE','FULL','STANDARD','PREMIUM')),
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'EUR',
  period text not null check (period in ('year','month')),
  min_commitment_months integer not null default 0,
  features jsonb not null default '{}',
  stripe_price_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (            -- trámites de precio fijo / por tipo
  id uuid primary key default gen_random_uuid(),
  code text not null unique,       -- 'requerimiento_basico','modelo_720','beckham','rectificativa_year'...
  name text not null,
  case_type text not null check (case_type in ('renta','requerimiento','rectificativa','autonomo','internacional')),
  price_cents integer check (price_cents >= 0),       -- null = a presupuestar
  price_max_cents integer check (price_max_cents is null or price_max_cents >= price_cents),
  success_fee_bps integer check (success_fee_bps between 0 and 10000),  -- 2000 = 20% del ahorro
  currency text not null default 'EUR',
  stripe_price_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reglas fiscales versionadas por ejercicio y territorio. El motor de cálculo lee de aquí, no de código.
create table tax_rules (
  id uuid primary key default gen_random_uuid(),
  tax_year integer not null check (tax_year between 2015 and 2100),
  territory text not null,         -- 'ESTATAL' o código de CCAA ('MD','CT','AN'...)
  kind text not null check (kind in ('tramos','minimos','deduccion','reduccion','limite')),
  code text not null,
  rule jsonb not null,             -- definición declarativa (tramos, importes, condiciones)
  source_url text,                 -- BOE/AEAT; obligatorio revisar cada campaña
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tax_year, territory, kind, code)
);

-- ---------- casos ----------
create table cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,   -- no se borra un caso presentado por borrar usuario; ver RGPD
  advisor_id uuid references profiles(id) on delete set null,
  service_id uuid references services(id),
  case_type text not null check (case_type in ('renta','requerimiento','rectificativa','autonomo','internacional')),
  tax_year integer check (tax_year between 2015 and 2100),
  status text not null default 'borrador'
    check (status in ('borrador','calculado','pagado','en_revision','pendiente_aprobacion','presentado','cerrado','cancelado')),
  regime text not null default 'comun' check (regime in ('comun','foral_navarra','foral_vasco')),
  result_amount_cents integer,        -- >0 a pagar, <0 a devolver
  savings_cents integer,              -- ahorro vs borrador
  currency text not null default 'EUR',
  aeat_reference text,                -- justificante / CSV de presentación
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un solo caso vivo por usuario, tipo y año (evita doble creación por doble clic)
create unique index cases_one_active on cases (user_id, case_type, tax_year)
  where status not in ('cerrado','cancelado') and case_type in ('renta','rectificativa');
create index on cases (user_id);
create index on cases (advisor_id, status);
create index on cases (status, created_at);

create table questionnaire_answers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  version integer not null default 1,
  answers jsonb not null default '{}',     -- hijos, discapacidad, alquiler, hipoteca, inversiones, pagadores...
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, version)
);

create table tax_data (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references cases(id) on delete cascade,
  source text not null check (source in ('manual','documento','aeat_datos_fiscales')),
  raw_json jsonb not null default '{}',    -- datos fiscales; cifrar en reposo
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table calculations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  rules_snapshot jsonb not null,           -- reglas usadas (reproducible aunque cambien tax_rules)
  input jsonb not null,
  output jsonb not null,                   -- desglose: base, cuota, deducciones aplicadas
  result_amount_cents integer not null,
  engine_version text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on calculations (case_id, created_at desc);

create table documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  kind text not null check (kind in ('carta_hacienda','justificante','declaracion','mandato','otro')),
  storage_path text not null,              -- bucket privado; acceso por URL firmada
  mime text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on documents (case_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  sender_kind text not null check (sender_kind in ('user','advisor','system')),
  channel text not null default 'app' check (channel in ('app','whatsapp','email')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on messages (case_id, created_at);

-- Revisión del experto + aprobación explícita del cliente (requisito legal y de producto)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  advisor_id uuid not null references profiles(id),
  status text not null default 'pendiente' check (status in ('pendiente','cambios_pedidos','aprobada_por_asesor','rechazada')),
  notes text,
  advisor_approved_at timestamptz,
  user_approved_at timestamptz,
  user_approval_ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_order check (user_approved_at is null or advisor_approved_at is not null)
);
create index on reviews (case_id);
create index on reviews (advisor_id, status);

-- ---------- pagos ----------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,
  plan_id uuid not null references plans(id),
  status text not null check (status in ('incomplete','active','past_due','canceled','expired')),
  auto_renew boolean not null default true,
  current_period_start timestamptz,
  renews_at timestamptz,
  canceled_at timestamptz,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on subscriptions (user_id, status);
create index on subscriptions (plan_id);
create index on subscriptions (renews_at) where status = 'active';

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,
  case_id uuid references cases(id) on delete set null,
  subscription_id uuid references subscriptions(id) on delete set null,
  type text not null check (type in ('plan','servicio','success_fee')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null check (status in ('pending','succeeded','failed','refunded')),
  stripe_payment_intent_id text unique,
  invoice_number text unique,              -- numeración correlativa legal; generar con secuencia
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payments (user_id);
create index on payments (case_id);

create table stripe_events (               -- idempotencia de webhooks
  id text primary key,                     -- event.id de Stripe
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- notificaciones y auditoría ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid references cases(id) on delete cascade,
  kind text not null,
  channel text not null default 'email' check (channel in ('email','push','whatsapp')),
  payload jsonb not null default '{}',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);
create index on notifications (case_id);
create index on notifications (sent_at) where sent_at is null;

create table audit_log (                   -- quién vio/cambió datos fiscales (obligación RGPD de trazabilidad)
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on audit_log (entity, entity_id);
create index on audit_log (actor_id, created_at desc);

-- ---------- reglas de integridad que no son del UI ----------
-- Nada se presenta sin revisión del asesor Y aprobación del usuario.
create function guard_case_submission() returns trigger language plpgsql as $$
begin
  if new.status = 'presentado' and old.status is distinct from 'presentado' then
    if not exists (select 1 from reviews r
                   where r.case_id = new.id and r.advisor_approved_at is not null and r.user_approved_at is not null) then
      raise exception 'case % cannot be submitted without advisor and user approval', new.id;
    end if;
    if new.aeat_reference is null then
      raise exception 'case % needs aeat_reference to be marked presentado', new.id;
    end if;
    new.submitted_at = now();
  end if;
  return new;
end $$;
create trigger cases_guard_submission before update on cases for each row execute function guard_case_submission();

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  for t in select table_name from information_schema.columns
           where table_schema='public' and column_name='updated_at' loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
do $$ declare t text; begin
  for t in select unnest(array['profiles','consents','plans','services','tax_rules','cases','questionnaire_answers',
    'tax_data','calculations','documents','messages','reviews','subscriptions','payments','stripe_events',
    'notifications','audit_log']) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- catálogo: lectura pública, escritura admin
create policy plans_read on plans for select using (active or is_admin());
create policy plans_admin on plans for all using (is_admin()) with check (is_admin());
create policy services_read on services for select using (active or is_admin());
create policy services_admin on services for all using (is_admin()) with check (is_admin());
create policy rules_read on tax_rules for select using (auth.uid() is not null);
create policy rules_admin on tax_rules for all using (is_admin()) with check (is_admin());

-- profiles: cada uno ve el suyo; staff ve los de sus casos; el rol NO lo cambia el propio usuario
create policy profiles_self on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());

create policy consents_own on consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy consents_staff_read on consents for select using (is_staff());

-- cases: dueño, o asesor asignado, o admin
create policy cases_owner on cases for select using (user_id = auth.uid());
create policy cases_owner_insert on cases for insert with check (user_id = auth.uid() and status = 'borrador' and advisor_id is null);
create policy cases_staff on cases for all
  using (is_admin() or (is_staff() and advisor_id = auth.uid()))
  with check (is_admin() or (is_staff() and advisor_id = auth.uid()));

-- tablas hijas: mismo criterio vía el caso
do $$ declare t text; begin
  for t in select unnest(array['questionnaire_answers','tax_data','calculations','documents','messages','reviews']) loop
    execute format($f$create policy %1$s_owner on %1$I for select using (
      exists (select 1 from cases c where c.id = %1$I.case_id and c.user_id = auth.uid()))$f$, t);
    execute format($f$create policy %1$s_staff on %1$I for all using (
      exists (select 1 from cases c where c.id = %1$I.case_id and (is_admin() or (is_staff() and c.advisor_id = auth.uid()))))
      with check (
      exists (select 1 from cases c where c.id = %1$I.case_id and (is_admin() or (is_staff() and c.advisor_id = auth.uid()))))$f$, t);
  end loop;
end $$;
-- el cliente escribe cuestionario, datos, documentos, mensajes y su aprobación en su propio caso (no en calculations)
create policy qa_owner_write on questionnaire_answers for all
  using (exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()));
create policy taxdata_owner_write on tax_data for all
  using (exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()));
create policy docs_owner_write on documents for insert
  with check (uploaded_by = auth.uid() and exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()));
create policy msgs_owner_write on messages for insert
  with check (sender_id = auth.uid() and sender_kind = 'user'
              and exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()));
-- la aprobación del usuario se hace por server action (service role) que fija user_approved_at + IP

create policy subs_own on subscriptions for select using (user_id = auth.uid() or is_admin());
create policy payments_own on payments for select using (user_id = auth.uid() or is_admin());
create policy notifs_own on notifications for select using (user_id = auth.uid());
-- stripe_events y audit_log: sin políticas = solo service role / admin
create policy audit_admin on audit_log for select using (is_admin());
-- escrituras en subscriptions, payments, stripe_events: solo service role (webhooks)

-- ---------- slots / citas de asesor (opcional, planes LIVE/FULL) ----------
create table advisor_slots (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references profiles(id) on delete cascade,
  case_id uuid references cases(id) on delete set null,
  during tstzrange not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_overlap exclude using gist (advisor_id with =, during with &&)   -- dos reservas del mismo hueco: imposible
);
create index on advisor_slots (case_id);
alter table advisor_slots enable row level security;
create policy slots_read on advisor_slots for select using (
  is_staff() or exists (select 1 from cases c where c.id = case_id and c.user_id = auth.uid()));
create trigger advisor_slots_touch before update on advisor_slots for each row execute function touch_updated_at();

-- ---------- endurecimiento posterior al esquema base ----------

-- El usuario no puede cambiar su rol, su cliente de Stripe ni su nº de colegiado. Solo service role (auth.uid() nulo) o admin.
create function guard_profile_update() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not is_admin() then
    if new.role is distinct from old.role
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.colegiado_no is distinct from old.colegiado_no
       or new.email is distinct from old.email then
      raise exception 'protected profile fields cannot be changed';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_profile_update();

-- Perfil automático al registrarse en Supabase Auth.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Facturas correlativas sin huecos (obligación fiscal): contador por año con bloqueo de fila.
create table invoice_counters (
  year integer primary key,
  last_number integer not null default 0
);
alter table invoice_counters enable row level security;  -- sin políticas: solo service role

create function next_invoice_number() returns text language plpgsql security definer set search_path = public as $$
declare y integer := extract(year from now() at time zone 'Europe/Madrid'); n integer;
begin
  insert into invoice_counters (year, last_number) values (y, 0) on conflict (year) do nothing;
  update invoice_counters set last_number = last_number + 1 where year = y returning last_number into n;
  return format('F-%s-%s', y, lpad(n::text, 6, '0'));
end $$;
revoke all on function next_invoice_number() from public, anon, authenticated;

-- El cliente solo puede borrar sus consentimientos? No: son registro de prueba. Quitamos delete/update del cliente.
drop policy consents_own on consents;
create policy consents_own_select on consents for select using (user_id = auth.uid());
create policy consents_own_insert on consents for insert with check (user_id = auth.uid());

-- Un documento o mensaje enviado no se edita ni se borra desde el cliente (solo service role).
-- (ya no hay políticas de update/delete para el dueño en documents y messages)

-- Un aviso de renovación se programa una sola vez por suscripción y periodo.
create unique index notifications_unique_renewal on notifications (user_id, kind, ((payload ->> 'period_end')))
  where kind = 'renewal_reminder';


-- ===== migrations/0002_catalog.sql =====
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


-- ===== migrations/0003_storage.sql =====
-- Bucket privado para cartas y justificantes. Ruta: {case_id}/{uuid}-{nombre}.
-- Solo se ejecuta en Supabase (el esquema storage existe allí); en un Postgres plano se omite.
do $$
begin
  if to_regnamespace('storage') is null then
    raise notice 'storage schema not found, skipping';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('case-documents', 'case-documents', false, 20971520, array['application/pdf','image/jpeg','image/png'])
  on conflict (id) do update set public = false, file_size_limit = 20971520,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

  execute $p$create policy case_docs_owner_read on storage.objects for select
    using (bucket_id = 'case-documents' and exists (
      select 1 from public.cases c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()))$p$;
  execute $p$create policy case_docs_staff_read on storage.objects for select
    using (bucket_id = 'case-documents' and exists (
      select 1 from public.cases c where c.id::text = (storage.foldername(name))[1]
        and (public.is_admin() or (public.is_staff() and c.advisor_id = auth.uid()))))$p$;
  execute $p$create policy case_docs_owner_insert on storage.objects for insert
    with check (bucket_id = 'case-documents' and exists (
      select 1 from public.cases c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()))$p$;
end $$;


-- ===== migrations/0004_ops.sql =====
-- Operación: límites de uso, reintentos de notificaciones y errores de webhooks.

create table rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
alter table rate_limits enable row level security;   -- sin políticas: solo service role

-- Devuelve true si la petición está permitida. Ventana fija por clave (p. ej. 'login:ip:1.2.3.4').
create function hit_rate_limit(p_key text, p_max integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare h integer;
begin
  insert into rate_limits (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else rate_limits.window_start end,
    hits = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rate_limits.hits + 1 end
  returning hits into h;
  return h <= p_max;
end $$;
revoke all on function hit_rate_limit(text, integer, integer) from public, anon, authenticated;

alter table notifications add column attempts integer not null default 0;
alter table notifications add column last_error text;
alter table notifications add column to_email text;
alter table stripe_events add column error text;

-- Un cliente solo ve sus notificaciones; el envío lo hace el servidor.
-- Asignación de asesor: el menos cargado. Se llama desde el servidor (service role).
create function pick_advisor() returns uuid language sql stable security definer set search_path = public as $$
  select p.id from profiles p
  where p.role = 'advisor' and p.deleted_at is null
  order by (select count(*) from cases c where c.advisor_id = p.id and c.status in ('en_revision','pendiente_aprobacion')), p.created_at
  limit 1;
$$;
revoke all on function pick_advisor() from public, anon, authenticated;


