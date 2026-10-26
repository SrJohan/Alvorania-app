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
