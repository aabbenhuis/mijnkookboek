# Mijn Digitaal Kookboek, v2 cloud versie

Dit is de cloud versie van Mijn Kookboek, gebouwd op Supabase. Werkt op alle apparaten met cloud sync, accounts en credit verkoop via Mollie.

De v1 versie (`../MijnKookboek_Website_v1.html`) blijft staan als lokale demo en als migratie bron.

## Mapstructuur

```
v2-cloud/
├── index.html              # entry point van de webapp
├── styles/                 # CSS opgesplitst in tokens, base, components
├── js/                     # frontend JavaScript modules
│   ├── api/                # Claude en OpenAI clients
│   ├── data/               # kookstijl definities en andere statics
│   ├── storage/            # Supabase client en wrapper
│   ├── views/              # per pagina een module
│   └── components/         # herbruikbare UI elementen
├── supabase/               # backend
│   ├── schema.sql          # tabellen, triggers, functies
│   ├── policies.sql        # Row Level Security regels
│   ├── storage.sql         # buckets en storage policies
│   └── functions/          # Edge functions
│       ├── claude-proxy/
│       ├── openai-image/
│       ├── mollie-checkout/
│       ├── mollie-webhook/
│       └── share-recipe/
└── README.md               # dit bestand
```

## Setup

### Stap 1: database schema uitvoeren

In Supabase dashboard, open de SQL Editor (linkermenu, icoontje met `>_`).

Run in deze volgorde:
1. `supabase/schema.sql` (tabellen, triggers, functies)
2. `supabase/policies.sql` (Row Level Security)
3. `supabase/storage.sql` (foto bucket)

Tip: kopieer de inhoud van elk bestand, plak in SQL Editor, klik **Run**.

### Stap 2: project URL en anon key opzoeken

In Supabase dashboard:
1. Klik tandwiel icoon linksonder (Project Settings)
2. Klik API in het submenu
3. Kopieer **Project URL** en **anon public** key

Deze komen straks in `js/config.js`.

### Stap 3: frontend lokaal draaien

```bash
cd v2-cloud
python3 -m http.server 8000
```

Open `http://localhost:8000` in je browser.

### Stap 4: deployen naar GitHub Pages

Komt later, na de basis is gebouwd.

## Database schema overzicht

| Tabel | Doel |
|---|---|
| `profiles` | Persoonlijke gegevens en credit teller per gebruiker |
| `recipes` | Recepten van een gebruiker |
| `shopping_lists` | Boodschappenlijst (een rij per gebruiker, items in jsonb) |
| `share_links` | Read only deellinks voor recepten of het hele kookboek |
| `credit_transactions` | Audit trail van alle credit veranderingen |
| `mollie_orders` | Aankoop bestellingen via Mollie |

## Database functies

| Functie | Wat |
|---|---|
| `handle_new_user()` | Trigger op auth.users insert. Maakt automatisch profile aan |
| `spend_credits()` | Trekt credits af met veiligheidscheck. Voorkomt minus saldo |
| `add_credits()` | Voegt credits toe na Mollie betaling of cadeau |
| `set_updated_at()` | Houdt updated_at velden automatisch bij |

## Beveiliging

Row Level Security (RLS) staat aan op alle tabellen. Dat betekent dat elke gebruiker alleen zijn eigen data kan lezen en wijzigen, ongeacht wat de frontend probeert. Dit is je belangrijkste beveiligingslaag.

API keys voor Claude en OpenAI staan **niet** meer in de frontend. Die zitten veilig in environment variables van de edge functions en worden door de proxy aangeroepen.

## Migratie van v1 naar v2

In de v2 frontend zit straks een knop "Importeer mijn lokale kookboek". Die leest de IndexedDB van v1 uit en uploadt alle recepten naar je Supabase account. Eenmalige actie.
