// App shell: top nav + content container + bottom nav
// Wordt gemount voor ingelogde gebruikers
// De content area wordt gevuld door views via router

import { STATE } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "./toast.js";
import { showView } from "../router.js";

let shellEl = null;
let contentEl = null;

export function mountShell(rootEl) {
  rootEl.innerHTML = `
    <div class="promo">
      Mijn Digitaal Kookboek <strong>met AI als souschef</strong>
    </div>

    <nav class="topnav">
      <div class="brand" data-nav="home">
        <div class="brand-mark">K</div>
        <span>Mijn Kookboek</span>
      </div>
      <div class="nav-links">
        <button class="nav-link" data-nav="home">Mijn kookboek</button>
        <button class="nav-link" data-nav="shopping">Boodschappen</button>
        <button class="nav-link" data-nav="add">Nieuw recept</button>
        <button class="nav-link" data-nav="settings">Instellingen</button>
      </div>
      <div class="nav-right">
        <button class="credit-pill" id="credit-pill" data-nav="credits" title="Klik om credits te kopen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
          <span id="credit-count">${STATE.profile?.credits ?? 0}</span> credits
        </button>
        <button class="btn btn-primary" data-nav="add">Nieuw recept</button>
      </div>
    </nav>

    <div id="view-content"></div>

    <footer class="app-footer">
      <div class="container">
        <div class="footer-row">
          <div class="footer-brand">
            <span>Mijn Digitaal Kookboek</span>
          </div>
          <div class="footer-links">
            <a href="voorwaarden.html" target="_blank">Voorwaarden</a>
            <a href="privacy.html" target="_blank">Privacy</a>
            <a href="mailto:info@mijndigitaalkookboek.nl">Contact</a>
          </div>
        </div>
      </div>
    </footer>

    <nav class="bottom-nav" id="bottom-nav">
      <button data-nav="home" data-bottom-nav="home">
        <span class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V6.5a2 2 0 0 1 1.32-1.88l6-2.2a2 2 0 0 1 1.36 0l6 2.2A2 2 0 0 1 20 6.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 21v-7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7"/></svg>
        </span>
        Kookboek
      </button>
      <button data-nav="shopping" data-bottom-nav="shopping">
        <span class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8h13"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
        </span>
        Boodschappen
      </button>
      <button class="center" data-nav="add" data-bottom-nav="add">
        <span class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
        Nieuw
      </button>
      <button data-nav="settings" data-bottom-nav="settings">
        <span class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </span>
        Instellingen
      </button>
    </nav>
  `;

  shellEl = rootEl;
  contentEl = rootEl.querySelector("#view-content");

  // Click handler for nav buttons
  rootEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-nav]");
    if (btn) {
      e.preventDefault();
      showView(btn.dataset.nav);
    }
  });

  return contentEl;
}

export function updateCreditDisplay() {
  const el = document.getElementById("credit-count");
  if (el) el.textContent = STATE.profile?.credits ?? 0;
}

export function updateActiveNav(name) {
  const bottomKey = (name === "detail") ? "home" : name;
  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.nav === bottomKey);
  });
  document.querySelectorAll(".bottom-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.bottomNav === bottomKey);
  });
}

export function getContent() { return contentEl; }
