#!/bin/bash
# Mijn Digitaal Kookboek v2 cloud, lokale dev server

cd "$(dirname "$0")"

IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1 2>/dev/null)
fi
if [ -z "$IP" ]; then
  IP="onbekend, check Systeem Instellingen, Wi-Fi, Details"
fi

clear
echo ""
echo "================================================================"
echo "   Mijn Digitaal Kookboek v2 cloud, lokale dev server"
echo "================================================================"
echo ""
echo "   Open op je Mac:"
echo "   http://localhost:8001"
echo ""
echo "   Open op je iPhone (zelfde wifi):"
echo "   http://$IP:8001"
echo ""
echo "----------------------------------------------------------------"
echo "   v1 draait op poort 8000, v2 draait op poort 8001"
echo "   Sluit dit venster of druk Ctrl+C om server te stoppen"
echo "================================================================"
echo ""

caffeinate -d -i python3 -m http.server 8001
