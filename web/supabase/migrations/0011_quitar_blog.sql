-- El blog pasa a la web pública en WordPress: la app ya no lo usa. Deshace 0010.
drop table if exists blog_posts;
drop table if exists blog_settings;

do $$
begin
  if to_regnamespace('storage') is null then
    raise notice 'storage schema not found, skipping';
    return;
  end if;
  delete from storage.objects where bucket_id = 'blog';
  delete from storage.buckets where id = 'blog';
end $$;
