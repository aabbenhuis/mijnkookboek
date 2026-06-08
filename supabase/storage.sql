-- Mijn Digitaal Kookboek, Supabase Storage setup
-- Run dit NA schema.sql en policies.sql
--
-- We hebben één bucket nodig voor recept foto's
-- Foto's worden geupload door de gebruiker en automatisch gecomprimeerd
-- door de frontend voordat ze naar Supabase Storage gaan

-- ============================================================
-- BUCKET AANMAKEN
-- Publiek leesbaar, schrijven alleen door geauthenticeerde gebruikers
-- ============================================================

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- POLICIES VOOR DE STORAGE BUCKET
-- ============================================================

-- Iedereen mag de foto's bekijken (publiek bucket)
drop policy if exists "Public read recipe photos" on storage.objects;
create policy "Public read recipe photos" on storage.objects
  for select using (bucket_id = 'recipe-photos');

-- Alleen ingelogde gebruikers mogen uploaden, en alleen in hun eigen folder
-- Folder structuur: recipe-photos/{user_id}/{recipe_id}/{filename}
drop policy if exists "Own upload recipe photos" on storage.objects;
create policy "Own upload recipe photos" on storage.objects
  for insert with check (
    bucket_id = 'recipe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Eigen foto's verwijderen
drop policy if exists "Own delete recipe photos" on storage.objects;
create policy "Own delete recipe photos" on storage.objects
  for delete using (
    bucket_id = 'recipe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Eigen foto's overschrijven (bv. nieuwe AI foto bij bestaand recept)
drop policy if exists "Own update recipe photos" on storage.objects;
create policy "Own update recipe photos" on storage.objects
  for update using (
    bucket_id = 'recipe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
