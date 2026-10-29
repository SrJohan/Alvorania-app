-- Precios: +20 % en cada plan y servicio (decisión de 2026-10-29).
-- La comisión sobre el ahorro (success_fee_bps) no cambia: sigue en el 20 %.
-- En Stripe los precios no se editan: hay que crear precios nuevos y cambiar STRIPE_PRICE_* (y stripe_price_id si se usa).

update plans set price_cents = case code
  when 'PRO'      then 3480    -- 29,00 → 34,80 €/año
  when 'LIVE'     then 7080    -- 59,00 → 70,80 €/año
  when 'FULL'     then 14280   -- 119,00 → 142,80 €/año
  when 'STANDARD' then 3588    -- 29,90 → 35,88 €/mes
  when 'PREMIUM'  then 7188    -- 59,90 → 71,88 €/mes
  else price_cents end
where code in ('PRO','LIVE','FULL','STANDARD','PREMIUM');

update services set price_cents = case code
  when 'requerimiento_basico'    then 6000    -- 50 → 60 €
  when 'requerimiento_complejo'  then 28680   -- desde 239 → desde 286,80 €
  when 'rectificativa_ejercicio' then 1200    -- 10 → 12 € por año
  else price_cents end
where code in ('requerimiento_basico','requerimiento_complejo','rectificativa_ejercicio');
