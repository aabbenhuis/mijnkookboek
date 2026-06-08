// Kookboek overzicht: lijst van recepten uit Supabase

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { COOK_STYLES, getDisplayCookStyle } from "../data/cook-styles.js";
import { MEAL_TYPES, DIETS, getDiet } from "../data/categories.js";

let containerEl = null;
let recipes = [];

export async function mount(container) {
  containerEl = container;
  updateActiveNav("home");
  await loadAndRender();
}

async function loadAndRender() {
  containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="muted-text text-center">Recepten laden...</p></div>`;
  try {
    recipes = await supabaseClient.listRecipes();
    render();
  } catch (err) {
    console.error(err);
    toast("Recepten ophalen mislukt", "error");
    containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="text-center" style="color: var(--error)">Er ging iets mis bij het laden van je recepten.</p></div>`;
  }
}

function render() {
  const firstName = STATE.profile?.first_name || "vriend van koken";
  const count = recipes.length;

  if (count === 0) {
    renderEmpty(firstName);
  } else {
    renderList(firstName, count);
  }
}

function renderEmpty(firstName) {
  const cookbookName = STATE.profile?.cookbook_name || "Mijn kookboek";
  containerEl.innerHTML = `
    <section class="hero">
      <div class="hero-dots">
        <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span>
        <span class="dot d4"></span><span class="dot d5"></span><span class="dot d6"></span>
        <span class="dot d7"></span><span class="dot d8"></span><span class="dot d9"></span>
        <span class="dot d10"></span>
      </div>
      <div class="hero-inner">
        <h1>Hoi ${escapeHtml(firstName)}, ${escapeHtml(cookbookName)} begint hier.</h1>
        <p class="subtitle">Bewaar je eigen recepten en bouw je persoonlijke kookboek op.</p>
        <div class="hero-buttons">
          <button class="btn btn-primary" data-nav="add">Voeg je eerste recept toe</button>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="container">
        <div class="empty-state">
          <h3>Nog geen recepten</h3>
          <p>Begin met een recept zelf in te vullen. AI generatie en foto inlezen volgen binnenkort.</p>
          <button class="btn btn-dark" data-nav="add">Maak je eerste recept</button>
        </div>
      </div>
    </section>
  `;
}

function renderList(firstName, count) {
  const cookbookName = STATE.profile?.cookbook_name || "Mijn kookboek";
  containerEl.innerHTML = `
    <section class="block compact">
      <div class="container">
        <div class="page-head">
          <div>
            <h1>${escapeHtml(cookbookName)}</h1>
            <p>${count} ${count === 1 ? "recept" : "recepten"} bewaard, ${escapeHtml(firstName)}</p>
          </div>
          <button class="btn btn-dark" data-nav="add">Voeg recept toe</button>
        </div>

        <div class="search-row">
          <input class="search-input" id="search-input" placeholder="Zoek op titel of ingredient" />
          <select id="filter-meal" class="search-input" style="max-width: 180px"></select>
          <select id="filter-style" class="search-input" style="max-width: 220px"></select>
          <button class="btn btn-secondary" id="btn-more-filters">Meer filters</button>
        </div>

        <div id="active-filters" class="active-filters"></div>

        <div id="more-filters-drawer" class="filters-drawer" style="display:none">
          <div class="filters-section">
            <h4>Dieet</h4>
            <div class="diet-grid">
              ${DIETS.map(d => `
                <label class="diet-option">
                  <input type="checkbox" name="filter-diet" value="${d.key}" />
                  <span>${d.icon} ${d.label}</span>
                </label>
              `).join("")}
            </div>
          </div>
          <div class="filters-section">
            <h4>Bereidingstijd</h4>
            <select id="filter-time" class="search-input">
              <option value="">Geen voorkeur</option>
              <option value="15">Onder 15 minuten</option>
              <option value="30">Onder 30 minuten</option>
              <option value="60">Onder een uur</option>
            </select>
          </div>
          <div class="filters-section">
            <h4>Beoordeling</h4>
            <select id="filter-rating" class="search-input">
              <option value="">Alle recepten</option>
              <option value="5">Alleen 5 sterren</option>
              <option value="4">Vier sterren of meer</option>
              <option value="3">Drie sterren of meer</option>
              <option value="1">Alleen beoordeelde recepten</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" id="btn-reset-filters">Wis alle filters</button>
            <button class="btn btn-primary" id="btn-apply-filters">Pas filters toe</button>
          </div>
        </div>

        <div id="recipe-grid" class="recipe-grid"></div>
      </div>
    </section>
  `;

  document.getElementById("search-input").addEventListener("input", applyFilter);
  populateMealFilter();
  populateStyleFilter();
  document.getElementById("filter-meal").addEventListener("change", applyFilter);
  document.getElementById("filter-style").addEventListener("change", applyFilter);

  document.getElementById("btn-more-filters").addEventListener("click", () => {
    const drawer = document.getElementById("more-filters-drawer");
    drawer.style.display = drawer.style.display === "none" ? "" : "none";
  });
  document.getElementById("btn-apply-filters").addEventListener("click", () => {
    applyFilter();
    document.getElementById("more-filters-drawer").style.display = "none";
  });
  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    document.getElementById("filter-meal").value = "";
    document.getElementById("filter-style").value = "";
    document.getElementById("filter-time").value = "";
    const rating = document.getElementById("filter-rating");
    if (rating) rating.value = "";
    document.querySelectorAll("input[name='filter-diet']").forEach(cb => cb.checked = false);
    document.getElementById("search-input").value = "";
    applyFilter();
    document.getElementById("more-filters-drawer").style.display = "none";
  });

  applyFilter();
}

function populateMealFilter() {
  const select = document.getElementById("filter-meal");
  if (!select) return;
  const counts = {};
  recipes.forEach(r => {
    if (r.meal_type) counts[r.meal_type] = (counts[r.meal_type] || 0) + 1;
  });
  let html = `<option value="">Alle maaltijden</option>`;
  MEAL_TYPES.forEach(m => {
    if (counts[m]) html += `<option value="${m}">${m} (${counts[m]})</option>`;
  });
  select.innerHTML = html;
}

function populateStyleFilter() {
  const select = document.getElementById("filter-style");
  if (!select) return;
  const counts = {};
  recipes.forEach(r => {
    const key = r.cook_style || "neutraal";
    counts[key] = (counts[key] || 0) + 1;
  });
  const usedStyles = Object.keys(counts).filter(k => k && k !== "neutraal");
  let html = `<option value="">Alle kookstijlen</option>`;
  if (counts["neutraal"]) html += `<option value="neutraal">Neutraal (${counts["neutraal"]})</option>`;
  usedStyles.sort((a, b) => counts[b] - counts[a]);
  usedStyles.forEach(key => {
    const cs = COOK_STYLES[key];
    if (!cs) return;
    html += `<option value="${key}">${escapeHtml(cs.label)} (${counts[key]})</option>`;
  });
  select.innerHTML = html;
}

function applyFilter() {
  const q = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  const mealFilter = document.getElementById("filter-meal")?.value || "";
  const styleFilter = document.getElementById("filter-style")?.value || "";
  const timeFilter = Number(document.getElementById("filter-time")?.value || 0);
  const ratingFilter = Number(document.getElementById("filter-rating")?.value || 0);
  const dietFilters = Array.from(document.querySelectorAll("input[name='filter-diet']:checked")).map(cb => cb.value);

  const filtered = recipes.filter(r => {
    if (mealFilter && r.meal_type !== mealFilter) return false;
    if (styleFilter && (r.cook_style || "neutraal") !== styleFilter) return false;
    if (timeFilter > 0 && (!r.cook_time || r.cook_time > timeFilter)) return false;
    if (ratingFilter > 0) {
      if (!r.rating || r.rating < ratingFilter) return false;
    }
    if (dietFilters.length > 0) {
      const recipeDiets = r.diet || [];
      const matchesAll = dietFilters.every(df => recipeDiets.includes(df));
      if (!matchesAll) return false;
    }
    if (!q) return true;
    const hay = (r.title + " " + (r.description || "") + " " + (r.ingredients || []).join(" ")).toLowerCase();
    return hay.includes(q);
  });

  renderActiveFilters({ mealFilter, styleFilter, timeFilter, ratingFilter, dietFilters, q });

  const grid = document.getElementById("recipe-grid");
  if (!grid) return;
  grid.innerHTML = filtered.map(recipeCardHtml).join("");
  grid.querySelectorAll("[data-recipe-id]").forEach(el => {
    el.addEventListener("click", () => showView("detail", { id: el.dataset.recipeId }));
  });
}

function renderActiveFilters({ mealFilter, styleFilter, timeFilter, ratingFilter, dietFilters, q }) {
  const el = document.getElementById("active-filters");
  if (!el) return;
  const chips = [];
  if (q) chips.push({ label: `Zoek: ${q}`, type: "search" });
  if (mealFilter) chips.push({ label: mealFilter, type: "meal" });
  if (styleFilter) {
    const cs = COOK_STYLES[styleFilter];
    chips.push({ label: cs?.label || styleFilter, type: "style" });
  }
  if (timeFilter) chips.push({ label: `Onder ${timeFilter} min`, type: "time" });
  if (ratingFilter) {
    const lbl = ratingFilter === 1 ? "Beoordeeld" : `${ratingFilter} sterren of meer`;
    chips.push({ label: lbl, type: "rating" });
  }
  dietFilters.forEach(df => {
    const d = getDiet(df);
    chips.push({ label: d?.label || df, type: "diet", value: df });
  });

  if (chips.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = chips.map(c => `<span class="filter-chip" data-filter-type="${c.type}" data-filter-value="${c.value || ''}">${escapeHtml(c.label)} <button>×</button></span>`).join("") +
    `<button class="btn-link" id="clear-all-filters" style="margin-left: 8px;">Alles wissen</button>`;

  el.querySelectorAll(".filter-chip").forEach(chip => {
    chip.querySelector("button").addEventListener("click", () => {
      const type = chip.dataset.filterType;
      if (type === "search") document.getElementById("search-input").value = "";
      else if (type === "meal") document.getElementById("filter-meal").value = "";
      else if (type === "style") document.getElementById("filter-style").value = "";
      else if (type === "time") document.getElementById("filter-time").value = "";
      else if (type === "rating") { const r = document.getElementById("filter-rating"); if (r) r.value = ""; }
      else if (type === "diet") {
        const val = chip.dataset.filterValue;
        const cb = document.querySelector(`input[name='filter-diet'][value='${val}']`);
        if (cb) cb.checked = false;
      }
      applyFilter();
    });
  });
  document.getElementById("clear-all-filters").addEventListener("click", () => {
    document.getElementById("btn-reset-filters").click();
  });
}

function recipeCardHtml(r) {
  const photoUrl = r.photo_url || "";
  const displayStyle = getDisplayCookStyle(r.cook_style);

  // Eén kookstijl badge bovenin (stylist tag alleen op detail pagina)
  const styleBadge = displayStyle
    ? `<div class="card-style-line"><span class="card-style-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg></span><span class="card-style-text">In de stijl van ${escapeHtml(displayStyle.primary)}</span></div>`
    : "";

  // Meta info: tijd, maaltijdtype, porties
  const metaParts = [];
  if (r.cook_time) metaParts.push(`${r.cook_time} min`);
  if (r.meal_type) metaParts.push(r.meal_type);
  if (r.servings) metaParts.push(`${r.servings} ${r.servings === 1 ? "portie" : "porties"}`);
  const metaLine = metaParts.length ? `<div class="card-meta-line">${metaParts.join(" · ")}</div>` : "";

  // Dieet badges met icoon
  const dietBadges = (r.diet && r.diet.length)
    ? `<div class="card-diet-row">${r.diet.slice(0, 3).map(k => {
        const d = getDiet(k);
        return d ? `<span class="card-diet-badge tint-${d.color}">${d.icon} ${escapeHtml(d.label)}</span>` : "";
      }).join("")}</div>`
    : "";

  // Vrije tags subtiel
  const tagsLine = (r.tags && r.tags.length)
    ? `<div class="card-tags-subtle">${r.tags.slice(0, 4).map(t => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  // Rating sterren
  const ratingLine = (r.rating && r.rating > 0)
    ? `<div class="card-rating-row">${renderSmallStars(r.rating)}</div>`
    : "";

  return `
    <div class="recipe-card" data-recipe-id="${r.id}">
      <div class="recipe-image ${photoUrl ? "" : "placeholder"}" ${photoUrl ? `style="background-image:url('${photoUrl}')"` : ""}>
        ${photoUrl ? "" : (r.meal_type || "Recept")}
      </div>
      <div class="recipe-body">
        <h3 class="recipe-title">${escapeHtml(r.title)}</h3>
        ${styleBadge}
        ${ratingLine}
        ${metaLine}
        ${dietBadges}
        ${tagsLine}
      </div>
    </div>
  `;
}

function renderSmallStars(value) {
  let html = `<div class="rating-stars">`;
  for (let i = 1; i <= 5; i++) {
    const filled = i <= value ? "filled" : "";
    html += `<span class="star ${filled}"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>`;
  }
  html += `</div>`;
  return html;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
