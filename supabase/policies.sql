-- Mijn Digitaal Kookboek, Row Level Security policies
-- Run dit NA schema.sql in de Supabase SQL editor
--
-- RLS zorgt dat een gebruiker alleen zijn eigen data kan zien en wijzigen
-- Dit is de belangrijkste beveiligingslaag voor multi-tenant data

-- ============================================================
-- RLS AANZETTEN OP ALLE TABELLEN
-- ============================================================

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.share_links enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.mollie_orders enable row level security;

-- ============================================================
-- PROFIELEN
-- Lezen: alleen je eigen profiel
-- Updaten: alleen je eigen profiel
-- Insert: gebeurt automatisch via trigger, niet direct door client
-- ============================================================

drop policy if exists "Own profile read" on public.profiles;
create policy "Own profile read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Own profile update" on public.profiles;
create policy "Own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- RECEPTEN
-- Lezen: eigen recepten, plus recepten die via share link gedeeld zijn
-- Insert: alleen voor eigen user_id
-- Updaten en verwijderen: alleen eigen recepten
-- ============================================================

drop policy if exists "Own recipes read" on public.recipes;
create policy "Own recipes read" on public.recipes
  for select using (auth.uid() = user_id);

drop policy if exists "Own recipes insert" on public.recipes;
create policy "Own recipes insert" on public.recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Own recipes update" on public.recipes;
create policy "Own recipes update" on public.recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Own recipes delete" on public.recipes;
create policy "Own recipes delete" on public.recipes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- BOODSCHAPPENLIJST
-- Eigen lijst zelf beheren
-- ============================================================

drop policy if exists "Own shopping read" on public.shopping_lists;
create policy "Own shopping read" on public.shopping_lists
  for select using (auth.uid() = user_id);

drop policy if exists "Own shopping update" on public.shopping_lists;
create policy "Own shopping update" on public.shopping_lists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Own shopping insert" on public.shopping_lists;
create policy "Own shopping insert" on public.shopping_lists
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- DEEL LINKS
-- Eigen links beheren
-- Publiek lezen via slug gebeurt via een edge function met service_role
-- zodat we view_count kunnen ophogen en eventueel expiry kunnen checken
-- ============================================================

drop policy if exists "Own share links read" on public.share_links;
create policy "Own share links read" on public.share_links
  for select using (auth.uid() = user_id);

drop policy if exists "Own share links insert" on public.share_links;
create policy "Own share links insert" on public.share_links
  for insert with check (auth.uid() = user_id);

drop policy if exists "Own share links delete" on public.share_links;
create policy "Own share links delete" on public.share_links
  for delete using (auth.uid() = user_id);

-- ============================================================
-- CREDIT TRANSACTIES
-- Alleen lezen voor eigen account
-- Insert gebeurt via spend_credits en add_credits functies (security definer)
-- ============================================================

drop policy if exists "Own credit tx read" on public.credit_transactions;
create policy "Own credit tx read" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- ============================================================
-- MOLLIE BESTELLINGEN
-- Alleen eigen bestellingen lezen
-- Insert en update gebeuren via edge functions (webhook + checkout)
-- ============================================================

drop policy if exists "Own mollie orders read" on public.mollie_orders;
create policy "Own mollie orders read" on public.mollie_orders
  for select using (auth.uid() = user_id);
