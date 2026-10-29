-- Endurecimiento de permisos (revisión de seguridad 2026-10-29).
-- Todas las escrituras del asesor y del admin pasan por acciones de servidor con service role, que comprueban
-- permisos y dejan rastro en audit_log. Por la API directa de Supabase (PostgREST, rol authenticated) el staff
-- solo lee. Así un asesor con su propio token no puede saltarse las acciones.

-- ---------- helpers ----------
-- ¿Lleva el usuario actual algún caso de este cliente? security definer: no depende del RLS de cases.
create function advises_user(p_user_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from cases c where c.user_id = p_user_id and c.advisor_id = auth.uid());
$$;

-- true si la sentencia llega desde la API como usuario (no service role ni migraciones).
create function is_api_user() returns boolean language sql stable as $$
  select current_user in ('authenticated', 'anon');
$$;

-- ---------- 1. Un asesor no puede falsificar la aprobación del cliente ----------
-- La aprobación del cliente solo la escribe userApprove() con service role (fija hora e IP).
drop policy reviews_staff on reviews;
create policy reviews_staff_read on reviews for select using (
  exists (select 1 from cases c where c.id = reviews.case_id and (is_admin() or (is_staff() and c.advisor_id = auth.uid()))));

create function guard_review_update() returns trigger language plpgsql as $$
begin
  if is_api_user() then
    raise exception 'reviews can only be changed by the server';
  end if;
  return coalesce(new, old);
end $$;
create trigger reviews_guard before insert or update or delete on reviews for each row execute function guard_review_update();

-- ---------- 2. Un asesor solo ve los perfiles de sus clientes ----------
drop policy profiles_self on profiles;
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin() or advises_user(id));

-- ---------- 3. Casos y tablas hijas: el staff solo lee por la API ----------
drop policy cases_staff on cases;
create policy cases_staff_read on cases for select using (is_admin() or (is_staff() and advisor_id = auth.uid()));

do $$ declare t text; begin
  for t in select unnest(array['questionnaire_answers','tax_data','calculations','documents','messages']) loop
    execute format('drop policy %I on %I', t || '_staff', t);
    execute format($f$create policy %1$s_staff_read on %1$I for select using (
      exists (select 1 from cases c where c.id = %1$I.case_id and (is_admin() or (is_staff() and c.advisor_id = auth.uid()))))$f$, t);
  end loop;
end $$;

-- ---------- 4. Nadie mueve un caso a otro cliente ----------
create function guard_case_owner() returns trigger language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'case owner cannot be changed';
  end if;
  return new;
end $$;
create trigger cases_guard_owner before update on cases for each row execute function guard_case_owner();

-- ---------- 5. El cliente no edita sus datos una vez aprobados por el asesor ----------
-- Antes: "for all" sin mirar el estado (podía cambiar datos de una declaración presentada, o borrarlos).
-- Ahora: insertar y actualizar solo mientras el caso está abierto a cambios; nunca borrar.
create function case_editable_by_owner(p_case_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from cases c where c.id = p_case_id and c.user_id = auth.uid()
                 and c.status in ('borrador','calculado','pagado','en_revision'));
$$;

drop policy qa_owner_write on questionnaire_answers;
create policy qa_owner_insert on questionnaire_answers for insert with check (case_editable_by_owner(case_id));
create policy qa_owner_update on questionnaire_answers for update using (case_editable_by_owner(case_id)) with check (case_editable_by_owner(case_id));

drop policy taxdata_owner_write on tax_data;
create policy taxdata_owner_insert on tax_data for insert with check (case_editable_by_owner(case_id));
create policy taxdata_owner_update on tax_data for update using (case_editable_by_owner(case_id)) with check (case_editable_by_owner(case_id));
