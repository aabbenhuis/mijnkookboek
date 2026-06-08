-- Aanvulling op storage.sql, voor seed-photos bucket
-- Voor voorbeeldrecepten die elke nieuwe gebruiker bij registratie krijgt
-- Run dit eenmalig in de Supabase SQL Editor

-- ============================================================
-- BUCKET AANMAKEN
-- Publiek leesbaar, alleen ingelogde gebruikers kunnen uploaden
-- (later kunnen we dat verder beperken tot admin only)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('seed-photos', 'seed-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- POLICIES
-- ============================================================

-- Iedereen mag de seed foto's bekijken (publiek bucket)
drop policy if exists "Public read seed photos" on storage.objects;
create policy "Public read seed photos" on storage.objects
  for select using (bucket_id = 'seed-photos');

-- Ingelogde gebruikers kunnen uploaden naar seed-photos
-- Tijdelijk open voor alle authenticated users, beperken we later tot admins
drop policy if exists "Authenticated upload seed photos" on storage.objects;
create policy "Authenticated upload seed photos" on storage.objects
  for insert with check (
    bucket_id = 'seed-photos'
    and auth.role() = 'authenticated'
  );

-- Ingelogde gebruikers kunnen seed foto's bijwerken
drop policy if exists "Authenticated update seed photos" on storage.objects;
create policy "Authenticated update seed photos" on storage.objects
  for update using (
    bucket_id = 'seed-photos'
    and auth.role() = 'authenticated'
  );
