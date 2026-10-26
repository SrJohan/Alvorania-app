-- F2 de replica/fixes.md: el cliente vuelve con el asesor que ya le conoce.
-- Primero, el asesor del caso más reciente de ese cliente, si sigue en activo (asesor o admin, sin baja).
-- Si no lo hay, el asesor con menos casos abiertos, como antes.

create function pick_advisor(p_user_id uuid) returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select c.advisor_id
      from cases c
      join profiles p on p.id = c.advisor_id
      where c.user_id = p_user_id
        and c.advisor_id is not null
        and p.role in ('advisor', 'admin')
        and p.deleted_at is null
      order by c.created_at desc
      limit 1
    ),
    (
      select p.id from profiles p
      where p.role = 'advisor' and p.deleted_at is null
      order by (select count(*) from cases c where c.advisor_id = p.id and c.status in ('en_revision', 'pendiente_aprobacion')), p.created_at
      limit 1
    )
  );
$$;
revoke all on function pick_advisor(uuid) from public, anon, authenticated;
