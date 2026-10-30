-- Asesores como una sola unidad (decisión 2026-10-30): todo asesor ve todos los casos, sus datos y los perfiles.
-- Por la API el staff sigue siendo solo lectura (las escrituras van por acciones de servidor, 0007). El admin conserva sus permisos extra.

drop policy profiles_self on profiles;
create policy profiles_self on profiles for select using (id = auth.uid() or is_staff());

drop policy cases_staff_read on cases;
create policy cases_staff_read on cases for select using (is_staff());

drop policy reviews_staff_read on reviews;
create policy reviews_staff_read on reviews for select using (is_staff());

do $$ declare t text; begin
  for t in select unnest(array['questionnaire_answers','tax_data','calculations','documents','messages']) loop
    execute format('drop policy %I on %I', t || '_staff_read', t);
    execute format('create policy %1$s_staff_read on %1$I for select using (is_staff())', t);
  end loop;
end $$;

drop function advises_user(uuid);

-- Solo en Supabase (ver 0003).
do $$
begin
  if to_regnamespace('storage') is null then return; end if;
  execute 'drop policy case_docs_staff_read on storage.objects';
  execute $p$create policy case_docs_staff_read on storage.objects for select
    using (bucket_id = 'case-documents' and public.is_staff())$p$;
end $$;
