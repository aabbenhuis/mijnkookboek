-- Migratie van category veld naar drie aparte velden:
--   meal_type: wanneer eet je het (één keuze)
--   dish_type: wat is het (één of meer keuzes)
--   diet: voor wie is het (één of meer keuzes)
--
-- Het oude category veld wordt voorlopig behouden voor backward compatibility
-- en kan later worden verwijderd.

-- ============================================================
-- KOLOMMEN TOEVOEGEN
-- ============================================================

alter table public.recipes
  add column if not exists meal_type text,
  add column if not exists dish_type text[] default array[]::text[],
  add column if not exists diet text[] default array[]::text[];

-- ============================================================
-- INDEXEN
-- ============================================================

create index if not exists recipes_meal_type_idx on public.recipes (meal_type);
create index if not exists recipes_dish_type_idx on public.recipes using gin (dish_type);
create index if not exists recipes_diet_idx on public.recipes using gin (diet);

-- ============================================================
-- DATA MIGRATIE
-- Map bestaande category waarde naar nieuwe velden
-- ============================================================

update public.recipes
set
  meal_type = case category
    when 'Ontbijt' then 'Ontbijt'
    when 'Lunch' then 'Lunch'
    when 'Avondeten' then 'Avondeten'
    when 'Bijgerecht' then 'Bijgerecht'
    when 'Toetje' then 'Toetje'
    when 'Drankje' then 'Drankje'
    when 'Bowl' then 'Lunch'
    when 'Soep' then 'Avondeten'
    when 'Salade' then 'Lunch'
    when 'Pasta' then 'Avondeten'
    else null
  end,
  dish_type = case category
    when 'Bowl' then array['Bowl']
    when 'Soep' then array['Soep']
    when 'Salade' then array['Salade']
    when 'Pasta' then array['Pasta']
    else array[]::text[]
  end
where meal_type is null and category is not null;
