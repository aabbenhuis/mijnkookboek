-- Bier of wijntip per recept.
-- Eigen tekst die Anke zelf schrijft of die de AI voorstelt.
-- Bestaande recepten krijgen een lege string en tonen "nog geen drinktip".
-- Belangrijk: draai deze migratie in de Supabase SQL editor voordat de nieuwe code live gaat,
-- anders mislukt het opslaan van een drinktip.

alter table public.recipes
  add column if not exists drink_pairing text default '';
