#!/bin/bash
# Mijn Digitaal Kookboek, SQL importer
# Dubbelklik dit bestand om SQL naar je klembord te kopieren

cd "$(dirname "$0")"

while true; do
  clear
  echo ""
  echo "================================================================"
  echo "   Supabase SQL importer voor Mijn Digitaal Kookboek"
  echo "================================================================"
  echo ""
  echo "   Hoe werkt dit:"
  echo "   1. Open Supabase SQL Editor in je browser"
  echo "      (linkermenu, icoon met >_)"
  echo "   2. Klik op het nummer hieronder om SQL te kopieren"
  echo "   3. Ga naar Supabase, klik New query, plak met Cmd+V"
  echo "   4. Klik Run rechtsonder"
  echo "   5. Kom hier terug en kies de volgende"
  echo ""
  echo "----------------------------------------------------------------"
  echo ""
  echo "   1) Kopieer schema.sql            (eerst doen)"
  echo "   2) Kopieer policies.sql          (na 1)"
  echo "   3) Kopieer storage.sql           (na 2)"
  echo "   4) Kopieer storage-seed.sql      (optioneel, voor seed bucket)"
  echo "   5) Kopieer schema-categories.sql (categorie splitsing migratie)"
  echo "   q) Sluit dit venster"
  echo ""
  echo "================================================================"
  echo ""
  read -p "Kies (1, 2, 3 of q): " choice
  echo ""

  case $choice in
    1)
      cat supabase/schema.sql | pbcopy
      echo ">>> schema.sql is naar je klembord gekopieerd"
      echo ">>> Ga naar Supabase SQL Editor, plak met Cmd+V, klik Run"
      echo ""
      read -p "Druk Enter zodra je klaar bent in Supabase..."
      ;;
    2)
      cat supabase/policies.sql | pbcopy
      echo ">>> policies.sql is naar je klembord gekopieerd"
      echo ">>> Ga naar Supabase SQL Editor, klik New query, plak met Cmd+V, klik Run"
      echo ""
      read -p "Druk Enter zodra je klaar bent in Supabase..."
      ;;
    3)
      cat supabase/storage.sql | pbcopy
      echo ">>> storage.sql is naar je klembord gekopieerd"
      echo ">>> Ga naar Supabase SQL Editor, klik New query, plak met Cmd+V, klik Run"
      echo ""
      read -p "Druk Enter zodra je klaar bent in Supabase..."
      ;;
    4)
      cat supabase/storage-seed.sql | pbcopy
      echo ">>> storage-seed.sql is naar je klembord gekopieerd"
      echo ">>> Ga naar Supabase SQL Editor, klik New query, plak met Cmd+V, klik Run"
      echo ""
      read -p "Druk Enter zodra je klaar bent in Supabase..."
      ;;
    5)
      cat supabase/schema-categories.sql | pbcopy
      echo ">>> schema-categories.sql is naar je klembord gekopieerd"
      echo ">>> Ga naar Supabase SQL Editor, klik New query, plak met Cmd+V, klik Run"
      echo ""
      read -p "Druk Enter zodra je klaar bent in Supabase..."
      ;;
    q|Q)
      echo "Klaar! Veel succes met de rest van de setup."
      echo ""
      exit 0
      ;;
    *)
      echo "Onbekende keuze. Kies 1, 2, 3 of q"
      sleep 2
      ;;
  esac
done
