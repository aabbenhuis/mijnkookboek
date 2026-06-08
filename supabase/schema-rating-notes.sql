-- Mijn Digitaal Kookboek, migratie: rating en persoonlijke notitie
-- Run dit in de Supabase SQL editor

alter table public.recipes
  add column if not exists rating integer check (rating is null or (rating between 1 and 5));

alter table public.recipes
  add column if not exists personal_notes text not null default '';

create index if not exists recipes_rating_idx on public.recipes (rating);
