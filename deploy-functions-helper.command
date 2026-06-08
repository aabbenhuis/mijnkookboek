#!/bin/bash
# Mijn Digitaal Kookboek, helper voor Edge Functions deployen
# Dubbelklik om function code naar klembord te kopieren

cd "$(dirname "$0")"

while true; do
  clear
  echo ""
  echo "================================================================"
  echo "   Edge Functions deploy helper voor Mijn Digitaal Kookboek"
  echo "================================================================"
  echo ""
  echo "   Hoe werkt dit:"
  echo "   1. Open Supabase, klik Edge Functions in linkermenu"
  echo "   2. Klik op het nummer hieronder om function code te kopieren"
  echo "   3. In Supabase: klik Deploy a new function (of vergelijkbaar)"
  echo "   4. Vul de exacte naam in van de function (zie hieronder)"
  echo "   5. Plak code met Cmd+V en klik Deploy"
  echo "   6. Kom hier terug en kies de volgende"
  echo ""
  echo "----------------------------------------------------------------"
  echo ""
  echo "   1) Kopieer claude-proxy code      (naam in Supabase: claude-proxy)"
  echo "   2) Kopieer claude-vision code     (naam in Supabase: claude-vision)"
  echo "   3) Kopieer openai-image code      (naam in Supabase: openai-image)"
  echo "   4) Kopieer share-create code      (naam in Supabase: share-create)"
  echo "   5) Kopieer share-read code        (naam in Supabase: share-read)"
  echo "   6) Kopieer mollie-create-payment  (naam in Supabase: mollie-create-payment)"
  echo "   7) Kopieer mollie-webhook         (naam in Supabase: mollie-webhook)"
  echo "   q) Sluit dit venster"
  echo ""
  echo "================================================================"
  echo ""
  read -p "Kies (1, 2, 3 of q): " choice
  echo ""

  case $choice in
    1)
      cat supabase/functions/claude-proxy/index.ts | pbcopy
      echo ">>> claude-proxy code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'claude-proxy', plak met Cmd+V, klik Deploy"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    2)
      cat supabase/functions/claude-vision/index.ts | pbcopy
      echo ">>> claude-vision code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'claude-vision', plak met Cmd+V, klik Deploy"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    3)
      cat supabase/functions/openai-image/index.ts | pbcopy
      echo ">>> openai-image code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'openai-image', plak met Cmd+V, klik Deploy"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    4)
      cat supabase/functions/share-create/index.ts | pbcopy
      echo ">>> share-create code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'share-create', plak met Cmd+V, klik Deploy"
      echo ">>> BELANGRIJK: na deploy, ga naar Settings tab en zet 'Verify JWT' UIT"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    5)
      cat supabase/functions/share-read/index.ts | pbcopy
      echo ">>> share-read code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'share-read', plak met Cmd+V, klik Deploy"
      echo ">>> BELANGRIJK: na deploy, ga naar Settings tab en zet 'Verify JWT' UIT (publiek leesbaar)"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    6)
      cat supabase/functions/mollie-create-payment/index.ts | pbcopy
      echo ">>> mollie-create-payment code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'mollie-create-payment', plak met Cmd+V, klik Deploy"
      echo ">>> Vergeet niet: zet 'Verify JWT' UIT en zet MOLLIE_API_KEY plus APP_URL als secrets"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    7)
      cat supabase/functions/mollie-webhook/index.ts | pbcopy
      echo ">>> mollie-webhook code is naar je klembord gekopieerd"
      echo ">>> In Supabase: New Function, naam 'mollie-webhook', plak met Cmd+V, klik Deploy"
      echo ">>> BELANGRIJK: zet 'Verify JWT' UIT (Mollie roept dit publiek aan)"
      echo ""
      read -p "Druk Enter zodra klaar in Supabase..."
      ;;
    q|Q)
      echo "Klaar! Vergeet niet de secrets te zetten (zie DEPLOY-GUIDE.md)"
      echo ""
      exit 0
      ;;
    *)
      echo "Onbekende keuze. Kies 1, 2, 3 of q"
      sleep 2
      ;;
  esac
done
