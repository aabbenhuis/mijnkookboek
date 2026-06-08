# Edge Functions deploy guide

Stap voor stap hoe je de drie Edge Functions in Supabase deployt en hun secrets instelt.

## Wat je nodig hebt

- Je Anthropic API key (vraag een nieuwe aan op console.anthropic.com onder API Keys)
- Je OpenAI API key (vraag een nieuwe aan op platform.openai.com onder API Keys)
- Toegang tot je Supabase dashboard

Tip: gebruik aparte keys voor deze cloud app, en zet een **spending limit** van bijvoorbeeld 10 euro per maand bij Anthropic en OpenAI. Zo voorkom je verrassingen.

---

## Stap 1: Secrets instellen in Supabase

Eerst de geheime keys opslaan, voordat je de functies deployt.

1. Open je Supabase dashboard, project Mijn Kookboek
2. Klik tandwiel icoon **linksonder** (Project Settings)
3. Onder Configuration: klik **Edge Functions**
4. Klik op de **Secrets** tab (of "Manage secrets" knop)
5. Klik **Add new secret** en voeg twee secrets toe:

| Naam | Waarde |
|---|---|
| `ANTHROPIC_API_KEY` | Je Anthropic key (begint met `sk-ant-`) |
| `OPENAI_API_KEY` | Je OpenAI key (begint met `sk-`) |

Klik Save bij elke secret.

---

## Stap 2: Helper script openen

In Finder, ga naar `v2-cloud/` en **dubbelklik `deploy-functions-helper.command`**.

Een Terminal opent met een menu vergelijkbaar met het SQL import script. Daar kun je per function code naar je klembord kopieren.

---

## Stap 3: Deploy claude-proxy

1. In Supabase: klik in het linkermenu (zwart) op het **Edge Functions** icoon (sigma teken Σ)
2. Klik **Deploy a new function** of de + knop
3. Function naam: typ **`claude-proxy`** exact zo (met streepje, lower case)
4. In het Terminal script: typ **1** en druk Enter (kopieert de code naar klembord)
5. Terug in Supabase, plak met **Cmd+V** in de code editor
6. Klik **Deploy** rechtsboven
7. Wacht tot je "Deployed successfully" ziet
8. Terug naar Terminal, druk Enter

---

## Stap 4: Deploy claude-vision

Zelfde stappen:
- Function naam: **`claude-vision`**
- Helper kies: **2**

---

## Stap 5: Deploy openai-image

Zelfde stappen:
- Function naam: **`openai-image`**
- Helper kies: **3**

---

## Stap 6: Verifieer

In het Edge Functions overzicht zou je drie functies moeten zien:
- claude-proxy
- claude-vision
- openai-image

Alle drie met status "Active" en het kleine groene puntje.

---

## Stap 7: Klaar voor frontend integratie

Geef het door zodra alle drie de functies live zijn. Dan integreer ik ze in de v2 frontend zodat je AI recept genereren, foto inlezen en AI foto's weer kunt gebruiken.

---

## Veelvoorkomende fouten en hun oplossing

| Wat je ziet | Wat het is |
|---|---|
| "Module not found" tijdens deploy | Code is incompleet geplakt, kopieer opnieuw via helper |
| "ANTHROPIC_API_KEY niet gevonden" bij testen | Secret is niet of fout ingesteld in stap 1 |
| Function deployt maar geeft 401 bij gebruik | Frontend stuurt geen JWT token mee, dat fixen we in de frontend integratie |
| Function deployt maar geeft 500 | Open Logs van die function in Supabase om de echte fout te zien |
