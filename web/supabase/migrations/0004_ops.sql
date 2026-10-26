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
