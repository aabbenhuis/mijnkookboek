-- Mijn Digitaal Kookboek, database schema v1
-- Run dit in de Supabase SQL editor, in deze volgorde
-- (Eerst extensions, dan tabellen, dan policies in policies.sql)

-- ============================================================
-- EXTENSIES
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFIELEN
-- Eén rij per gebruiker, gekoppeld aan auth.users
-- Bevat persoonlijke voorkeuren en credit teller
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  cookbook_name text not null default 'Mijn Kookboek',
  default_cook_style text not null default 'neutraal',
  language text not null default 'nl',
  credits integer not null default 10,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_credits_idx on public.profiles (credits);

-- ============================================================
-- RECEPTEN
-- Eén rij per recept, gekoppeld aan profile
-- Bevat alle recept data inclusief foto als publieke URL
-- ============================================================

create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  cook_time integer,
  servings integer,
  category text default 'Anders',
  tags text[] default array[]::text[],
  ingredients text[] not null default array[]::text[],
  instructions text[] not null default array[]::text[],
  tips text default '',
  photo_url text default '',
  nutrition jsonb,
  cook_style text default 'neutraal',
  source text default 'manual',
  language text not null default 'nl',
  is_example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipes_created_at_idx on public.recipes (created_at desc);
create index if not exists recipes_category_idx on public.recipes (category);

-- ============================================================
-- BOODSCHAPPENLIJST
-- Eén rij per gebruiker, alle items in jsonb array
-- Simpeler dan tabel met item rijen, snel te updaten als geheel
-- ============================================================

create table if not exists public.shopping_lists (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DEEL LINKS
-- Voor het delen van een recept of het hele kookboek via URL
-- Read only voor de ontvanger, geen account vereist
-- ============================================================

create table if not exists public.share_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('recipe', 'cookbook')),
  target_id uuid,
  slug text unique not null,
  view_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists share_links_slug_idx on public.share_links (slug);
create index if not exists share_links_user_id_idx on public.share_links (user_id);

-- ============================================================
-- CREDIT TRANSACTIES
-- Audit trail van alle credit veranderingen
-- Belangrijk voor financiële verantwoording en debugging
-- ============================================================

create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('purchase', 'gift', 'action', 'refund', 'admin')),
  action_kind text,
  mollie_payment_id text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists credit_tx_user_id_idx on public.credit_transactions (user_id, created_at desc);
create index if not exists credit_tx_mollie_idx on public.credit_transactions (mollie_payment_id);

-- ============================================================
-- MOLLIE BESTELLINGEN
-- Voor de credit verkoop via Mollie
-- ============================================================

create table if not exists public.mollie_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package text not null check (package in ('proef', 'populair', 'power')),
  credits integer not null,
  amount_eur numeric(8,2) not null,
  status text not null default 'open' check (status in ('open', 'paid', 'failed', 'expired', 'canceled', 'refunded')),
  mollie_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mollie_user_id_idx on public.mollie_orders (user_id, created_at desc);
create index if not exists mollie_status_idx on public.mollie_orders (status);

-- ============================================================
-- TRIGGERS
-- Houd updated_at velden automatisch bij
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

drop trigger if exists shopping_lists_set_updated_at on public.shopping_lists;
create trigger shopping_lists_set_updated_at
  before update on public.shopping_lists
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCTIE: automatisch profile aanmaken bij nieuwe gebruiker
-- Wordt aangeroepen vanuit een trigger op auth.users
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Vriend van koken')
  );

  insert into public.shopping_lists (user_id, items)
  values (new.id, '[]'::jsonb);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCTIE: credits opnemen met veiligheidscheck
-- Voorkomt dat credits onder nul kunnen gaan
-- Gebruikt door edge functions wanneer een AI actie wordt uitgevoerd
-- ============================================================

create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_action_kind text,
  p_description text default null
)
returns integer as $$
declare
  v_current integer;
  v_new integer;
begin
  select credits into v_current from public.profiles where id = p_user_id for update;

  if v_current is null then
    raise exception 'Profile not found';
  end if;

  if v_current < p_amount then
    raise exception 'Insufficient credits: need % but have %', p_amount, v_current;
  end if;

  v_new := v_current - p_amount;

  update public.profiles set credits = v_new where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, type, action_kind, description)
  values (p_user_id, -p_amount, 'action', p_action_kind, p_description);

  return v_new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTIE: credits toevoegen (Mollie betaling of cadeau)
-- ============================================================

create or replace function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_mollie_id text default null,
  p_description text default null
)
returns integer as $$
declare
  v_new integer;
begin
  update public.profiles
    set credits = credits + p_amount
    where id = p_user_id
    returning credits into v_new;

  if v_new is null then
    raise exception 'Profile not found';
  end if;

  insert into public.credit_transactions (user_id, amount, type, mollie_payment_id, description)
  values (p_user_id, p_amount, p_type, p_mollie_id, p_description);

  return v_new;
end;
$$ language plpgsql security definer;
