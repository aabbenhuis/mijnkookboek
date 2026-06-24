// Boodschappenlijst view, met cloud sync via Supabase

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { confirmModal } from "../components/modal.js";
import { updateActiveNav } from "../components/app-shell.js";
import { showView } from "../router.js";

let containerEl = null;
let items = [];

const CATEGORY_LABELS = {
  "groente": "Groente en fruit",
  "zuivel": "Zuivel en eieren",
  "vlees-vis": "Vlees en vis",
  "droogwaren": "Droogwaren en granen",
  "kruiden": "Kruiden, sauzen en olies",
  "overig": "Overig",
};

const CATEGORY_ORDER = ["groente", "zuivel", "vlees-vis", "droogwaren", "kruiden", "overig"];

const CAT_COLORS = {
  "groente": "#1aae39",
  "zuivel": "#0075de",
  "vlees-vis": "#ff64c8",
  "droogwaren": "#dd5b00",
  "kruiden": "#2a9d99",
  "overig": "#a4a097",
};

const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

export async function mount(container) {
  containerEl = container;
  updateActiveNav("shopping");
  containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="muted-text text-center">Boodschappenlijst laden...</p></div>`;
  try {
    items = await supabaseClient.getShoppingList();
    render();
  } catch (err) {
    console.error(err);
    toast("Boodschappenlijst ophalen mislukt", "error");
  }
}

function render() {
  if (!items.length) {
    containerEl.innerHTML = `
      <section class="block">
        <div class="container">
          <div class="page-hero">
            <div class="page-hero-icon tint-mint">${CART_SVG}</div>
            <div class="page-hero-text">
              <h1>Boodschappenlijst</h1>
              <p>Voeg ingredienten toe vanuit een recept.</p>
            </div>
          </div>
          <div class="empty-state">
            <h3>Je boodschappenlijst is leeg</h3>
            <p>Open een recept en tik op "Voeg toe aan boodschappenlijst". Alle ingredienten verschijnen hier, gegroepeerd per categorie.</p>
            <button class="btn btn-primary" data-nav="home">Naar mijn kookboek</button>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const remaining = items.filter(i => !i.checked).length;
  const groups = {};
  const checkedItems = [];
  items.forEach(i => {
    if (i.checked) { checkedItems.push(i); return; }
    groups[i.category] = groups[i.category] || [];
    groups[i.category].push(i);
  });

  const done = items.length - remaining;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  let html = `
    <section class="block">
      <div class="container">
        <div class="page-hero">
          <div class="page-hero-icon tint-mint">${CART_SVG}</div>
          <div class="page-hero-text">
            <h1>Boodschappenlijst</h1>
            <p>${remaining ? `Nog ${remaining} te halen` : "Alles gehaald, goed bezig"}</p>
          </div>
          <button class="btn btn-secondary page-hero-action" id="btn-clear">Lijst legen</button>
        </div>

        <div class="shop-progress"><span style="width:${pct}%"></span></div>
        <div class="shop-progress-label">${done} van ${items.length} afgevinkt</div>

        <div id="shopping-content">
  `;

  CATEGORY_ORDER.forEach(key => {
    const list = groups[key];
    if (!list || !list.length) return;
    const label = CATEGORY_LABELS[key] || "Overig";
    const color = CAT_COLORS[key] || CAT_COLORS.overig;
    html += `<div class="shop-cat"><span class="dot" style="background:${color}"></span><span>${escapeHtml(label)}</span></div>
    <div class="shop-group">
      ${list.map(i => `
        <div class="shop-item ${i.checked ? "done" : ""}" data-shop-id="${i.id}">
          <input type="checkbox" ${i.checked ? "checked" : ""} data-shop-check="${i.id}">
          <span class="label">${escapeHtml(i.text)}</span>
          <button class="remove" data-shop-remove="${i.id}" title="Verwijderen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>
          </button>
        </div>
      `).join("")}
    </div>`;
  });

  if (checkedItems.length) {
    html += `<div class="shop-cat shop-cat-done"><span class="dot" style="background:#c4c0b7"></span><span>Afgevinkt (${checkedItems.length})</span></div>
    <div class="shop-group">
      ${checkedItems.map(i => `
        <div class="shop-item done" data-shop-id="${i.id}">
          <input type="checkbox" checked data-shop-check="${i.id}">
          <span class="label">${escapeHtml(i.text)}</span>
          <button class="remove" data-shop-remove="${i.id}" title="Verwijderen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>
          </button>
        </div>
      `).join("")}
    </div>`;
  }

  html += `
        </div>
        <div class="form-actions" style="margin-top: 24px;">
          <button class="btn btn-secondary" id="btn-export">Kopieer als tekst</button>
          <button class="btn btn-secondary" id="btn-uncheck">Afgevinkte terugzetten</button>
        </div>
      </div>
    </section>
  `;
  containerEl.innerHTML = html;
  bindEvents();
}

function bindEvents() {
  containerEl.querySelectorAll("[data-shop-check]").forEach(cb => {
    cb.addEventListener("change", async () => {
      const id = cb.dataset.shopCheck;
      const item = items.find(i => i.id === id);
      if (item) {
        item.checked = cb.checked;
        await persist();
        render();
      }
    });
  });
  containerEl.querySelectorAll("[data-shop-remove]").forEach(btn => {
    btn.addEventListener("click", async () => {
      items = items.filter(i => i.id !== btn.dataset.shopRemove);
      await persist();
      render();
    });
  });
  document.getElementById("btn-clear")?.addEventListener("click", async () => {
    const ok = await confirmModal("Lijst legen", "Hiermee verwijder je alle ingredienten uit je boodschappenlijst.");
    if (!ok) return;
    items = [];
    await persist();
    render();
    toast("Boodschappenlijst geleegd", "success");
  });
  document.getElementById("btn-uncheck")?.addEventListener("click", async () => {
    items = items.map(i => ({ ...i, checked: false }));
    await persist();
    render();
  });
  document.getElementById("btn-export")?.addEventListener("click", async () => {
    const groups = {};
    items.forEach(i => { groups[i.category] = groups[i.category] || []; groups[i.category].push(i); });
    let text = "Mijn boodschappenlijst\n\n";
    CATEGORY_ORDER.forEach(key => {
      const list = groups[key];
      if (!list || !list.length) return;
      text += `${CATEGORY_LABELS[key] || "Overig"}\n`;
      list.forEach(i => { text += `  ${i.checked ? "[x]" : "[ ]"} ${i.text}\n`; });
      text += "\n";
    });
    try {
      await navigator.clipboard.writeText(text);
      toast("Lijst gekopieerd naar klembord", "success");
    } catch {
      toast("Kopieren mislukt", "error");
    }
  });
}

async function persist() {
  try {
    await supabaseClient.saveShoppingList(items);
  } catch (err) {
    console.error(err);
    toast("Opslaan mislukt", "error");
  }
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
