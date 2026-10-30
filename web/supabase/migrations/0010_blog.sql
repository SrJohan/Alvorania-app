-- Blog propio (sustituye al RSS de Gestoría eMadrid). Ver docs/superpowers/specs/2026-10-30-blog-design.md.
-- Igual que en 0007: por la API (rol authenticated) solo se lee. Escribir, publicar y cambiar estilos pasa por
-- acciones de servidor con service role (src/server/blog-actions.ts), que comprueban el rol y el estado.

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null default '',
  excerpt text not null default '',
  body_html text not null default '',
  cover_path text,
  category text not null default 'renta' check (category in ('renta','autonomos','empresas','tramites')),
  style text check (style in ('clasico','tinta','calido','destacado')),   -- null: el estilo global del blog
  status text not null default 'borrador' check (status in ('borrador','en_revision','publicado')),
  review_note text,
  author_id uuid not null references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on blog_posts (status, published_at desc);
create index on blog_posts (author_id);
create trigger blog_posts_touch before update on blog_posts for each row execute function touch_updated_at();

create table blog_settings (
  id boolean primary key default true check (id),
  style text not null default 'clasico' check (style in ('clasico','tinta','calido','destacado')),
  updated_at timestamptz not null default now()
);
insert into blog_settings (id) values (true);
create trigger blog_settings_touch before update on blog_settings for each row execute function touch_updated_at();

alter table blog_posts enable row level security;
alter table blog_settings enable row level security;

-- Cualquiera lee lo publicado; el asesor, además, sus propios posts; el admin, todo. Sin políticas de escritura.
create policy blog_posts_read on blog_posts for select using (
  status = 'publicado' or is_admin() or (is_staff() and author_id = auth.uid()));
create policy blog_settings_read on blog_settings for select using (true);
grant select on blog_posts, blog_settings to anon;

-- Imágenes del blog: bucket público (se sirven en la web). Se suben con URL firmada que emite el servidor.
do $$
begin
  if to_regnamespace('storage') is null then
    raise notice 'storage schema not found, skipping';
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('blog', 'blog', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = true, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];
end $$;
