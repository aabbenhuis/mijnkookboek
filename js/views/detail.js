// Recept detail view: tonen, portie scaler, verwijderen, naar boodschappenlijst,
// AI foto genereren, voedingswaarden berekenen, eigen foto uploaden

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { confirmModal } from "../components/modal.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { STATE, setState } from "../state.js";
import { COOK_STYLES, getImageHint, getDisplayCookStyle, getStylistTag } from "../data/cook-styles.js";
import { getDiet } from "../data/categories.js";
import { showShareModal } from "../components/share-modal.js";
import { PHOTO_MAX_DIM, PHOTO_QUALITY, PHOTO_MAX_UPLOAD_MB, CREDIT_COSTS } from "../config.js";

let containerEl = null;
let currentRecipe = null;

export async function mount(container, params) {
  containerEl = container;
  updateActiveNav("detail");
  if (!params?.id) {
    toast("Geen recept gevonden", "error");
    showView("home");
    return;
  }
  containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="muted-text text-center">Recept laden...</p></div>`;
  try {
    currentRecipe = await supabaseClient.getRecipe(params.id);
    render();
  } catch (err) {
    console.error(err);
    toast("Recept niet gevonden", "error");
    showView("home");
  }
}

function render() {
  const r = currentRecipe;
  const tags = (r.tags || []);
  const tagColors = ["tag-purple", "tag-orange", "tag-green", "tag-sky"];
  const displayStyle = getDisplayCookStyle(r.cook_style);
  let styleBadge = "";
  if (displayStyle) {
    const personBadge = `<span class="badge badge-purple">In de stijl van ${escapeHtml(displayStyle.primary)}</span>`;
    const tagBadge = displayStyle.stylistTag
      ? `<span class="badge badge-stylist">${escapeHtml(displayStyle.stylistTag)}</span>`
      : "";
    styleBadge = `<div class="style-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;">${personBadge}${tagBadge}</div>`;
  }

  // Herkomst van het recept als klein label boven de titel
  const SRC = {
    example:   { label: "Voorbeeldrecept", tint: "sky",      icon: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>' },
    manual:    { label: "Zelf gemaakt",    tint: "cream",    icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>' },
    "ai-form": { label: "AI gerecht",  tint: "mint",     icon: '<path d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z"/>' },
    "ai-chat": { label: "AI gerecht",  tint: "mint",     icon: '<path d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z"/>' },
    photo:     { label: "Uit een foto",    tint: "lavender", icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' },
    link:      { label: "Van een link",    tint: "rose",     icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  };
  const sm = r.is_example ? SRC.example : (SRC[r.source] || SRC.manual);
  const sourceChip = `<span class="detail-source tint-${sm.tint}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${sm.icon}</svg>${sm.label}</span>`;

  // Fotoherkomst: alleen tonen als er een foto is en we weten waar die vandaan komt
  let photoOrigin = "";
  if (r.photo_url && (r.photo_is_ai === true || r.photo_is_ai === false)) {
    const isAi = r.photo_is_ai === true;
    const pIcon = isAi
      ? '<path d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z"/>'
      : '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
    photoOrigin = `<div class="photo-origin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pIcon}</svg>${isAi ? "AI foto" : "Eigen foto"}</div>`;
  }

  containerEl.innerHTML = `
    <section class="block">
      <div class="container">
        <div class="row between" style="padding: 32px 0 0">
          <button class="btn btn-ghost recipe-detail-back" data-nav="home">Terug naar kookboek</button>
          <div class="recipe-detail-actions">
            <button class="btn btn-secondary" id="btn-edit">Bewerk</button>
            <button class="btn btn-secondary" id="btn-share">Deel</button>
            <button class="btn btn-danger" id="btn-delete">Verwijder</button>
            <button class="btn-icon-only" id="btn-edit-icon" title="Bewerk recept" aria-label="Bewerk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon-only" id="btn-share-icon" title="Deel recept" aria-label="Deel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button class="btn-icon-only danger" id="btn-delete-icon" title="Verwijder recept" aria-label="Verwijder">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>

        <div class="recipe-detail">
          <div>
            ${r.photo_url
              ? `<div class="photo" style="background-image:url('${r.photo_url}')"></div>`
              : `<div class="photo">Geen foto</div>`}
            ${photoOrigin}
          </div>
          <div>
            ${sourceChip}
            ${styleBadge}
            <h1>${escapeHtml(r.title)}</h1>
            <p style="color: var(--slate); margin: 0 0 12px; font-size: 18px;">${escapeHtml(r.description || "")}</p>

            <div style="margin: 0 0 20px;">
              ${renderRatingStars(r.rating || 0, true)}
            </div>

            <div class="recipe-meta-row">
              ${r.cook_time ? `<span class="meta-pill">${r.cook_time} min</span>` : ""}
              ${r.meal_type ? `<span class="meta-pill">${escapeHtml(r.meal_type)}</span>` : ""}
              ${(r.dish_type || []).map(d => `<span class="meta-pill">${escapeHtml(d)}</span>`).join("")}
              <span class="meta-pill">
                Porties
                <span class="scaler">
                  <button data-scale="-1">−</button>
                  <span class="servings" id="serv-display">${r.servings || 1}</span>
                  <button data-scale="1">+</button>
                </span>
              </span>
            </div>

            ${pairingChipsHtml(r)}

            ${(r.diet && r.diet.length) ? `<div class="diet-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">${r.diet.map(k => {
              const d = getDiet(k);
              return d ? `<span class="diet-badge tint-${d.color}">${d.icon} ${escapeHtml(d.label)}</span>` : "";
            }).join("")}</div>` : ""}

            ${tags.length ? `<div class="recipe-tags" style="margin-bottom: 16px">${tags.map((t, i) => `<span class="tag-chip ${tagColors[i % 4]}">${escapeHtml(t)}</span>`).join("")}</div>` : ""}

            <div style="margin: 16px 0 24px">
              <button class="btn btn-dark" id="btn-add-shopping" style="width: 100%">Voeg toe aan boodschappenlijst</button>
            </div>

            <div class="recipe-section ingredients">
              <h2>Ingredienten</h2>
              <ul id="ingredients-list">
                ${(r.ingredients || []).map(i => `<li data-original="${escapeAttr(i)}">${escapeHtml(i)}</li>`).join("")}
              </ul>
            </div>

            <div class="recipe-section instructions">
              <h2>Bereiding</h2>
              <ol>
                ${(r.instructions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ol>
            </div>

            ${r.tips ? `<div class="recipe-section"><h2>Tip</h2><p>${escapeHtml(r.tips)}</p></div>` : ""}

            <div class="recipe-section" id="pairing-section">
              ${renderPairingBlock(r)}
            </div>

            <div id="personal-notes-section">
              ${renderNotesBlock(r.personal_notes || "")}
            </div>

            <div class="recipe-section" id="nutrition-section">
              <h2>Voedingswaarden per portie</h2>
              ${renderNutritionBlock(r)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  bindScaler();
  bindDelete();
  bindShopping();
  bindNutritionAction();
  bindShareAction();
  bindEditAction();
  bindRatingAction();
  bindNotesAction();
  bindPairingAction();
}

function renderRatingStars(value, interactive) {
  const cls = interactive ? "rating-stars interactive" : "rating-stars";
  let html = `<div class="${cls}" data-rating="${value}">`;
  for (let i = 1; i <= 5; i++) {
    const filled = i <= value ? "filled" : "";
    html += `<button type="button" class="star ${filled}" data-star="${i}" aria-label="${i} sterren">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    </button>`;
  }
  const label = value > 0
    ? `<span class="rating-stars-label">Jouw beoordeling</span>`
    : `<span class="rating-stars-label">Geef een beoordeling</span>`;
  html += `</div>${label}`;
  return html;
}

function renderNotesBlock(notes) {
  if (notes && notes.trim()) {
    return `
      <div class="personal-notes-block">
        <h3>Jouw notitie</h3>
        <p id="notes-display">${escapeHtml(notes)}</p>
        <div class="personal-notes-actions">
          <button class="btn btn-secondary" id="btn-edit-notes">Bewerk notitie</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="personal-notes-block">
      <h3>Jouw notitie</h3>
      <p class="muted-text" style="font-style: italic; margin: 0 0 10px;">Nog geen notitie. Schrijf op wat je aanpaste of wat de smaak ervan vond.</p>
      <button class="btn btn-secondary" id="btn-add-notes">Voeg notitie toe</button>
    </div>
  `;
}

function bindEditAction() {
  const handler = () => showView("add", { editId: currentRecipe.id });
  const btn1 = document.getElementById("btn-edit");
  const btn2 = document.getElementById("btn-edit-icon");
  if (btn1) btn1.addEventListener("click", handler);
  if (btn2) btn2.addEventListener("click", handler);
}

function bindRatingAction() {
  const container = document.querySelector(".rating-stars.interactive");
  if (!container) return;
  container.querySelectorAll(".star").forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = Number(btn.dataset.star);
      const current = Number(container.dataset.rating || 0);
      const newRating = value === current ? null : value;
      try {
        await supabaseClient.updateRecipe(currentRecipe.id, { rating: newRating });
        currentRecipe.rating = newRating;
        const wrap = container.parentElement;
        wrap.innerHTML = renderRatingStars(newRating || 0, true);
        bindRatingAction();
        toast(newRating ? `Beoordeling: ${newRating} sterren` : "Beoordeling gewist", "success");
      } catch (err) {
        toast(err.message || "Beoordelen mislukt", "error");
      }
    });
  });
}

function bindNotesAction() {
  const section = document.getElementById("personal-notes-section");
  if (!section) return;

  const wireEdit = () => {
    const editBtn = section.querySelector("#btn-edit-notes, #btn-add-notes");
    if (!editBtn) return;
    editBtn.addEventListener("click", () => {
      const currentNotes = currentRecipe.personal_notes || "";
      section.innerHTML = `
        <div class="personal-notes-block">
          <h3>Jouw notitie</h3>
          <textarea id="notes-input" placeholder="Bijvoorbeeld: vorige keer extra knoflook toegevoegd, mijn kinderen vonden het lekker.">${escapeHtml(currentNotes)}</textarea>
          <div class="personal-notes-actions">
            <button class="btn btn-secondary" id="btn-cancel-notes">Annuleer</button>
            <button class="btn btn-dark" id="btn-save-notes">Bewaar notitie</button>
          </div>
        </div>
      `;
      document.getElementById("btn-cancel-notes").addEventListener("click", () => {
        section.innerHTML = renderNotesBlock(currentRecipe.personal_notes || "");
        wireEdit();
      });
      document.getElementById("btn-save-notes").addEventListener("click", async () => {
        const newNotes = document.getElementById("notes-input").value.trim();
        try {
          await supabaseClient.updateRecipe(currentRecipe.id, { personal_notes: newNotes });
          currentRecipe.personal_notes = newNotes;
          section.innerHTML = renderNotesBlock(newNotes);
          wireEdit();
          toast("Notitie bewaard", "success");
        } catch (err) {
          toast(err.message || "Bewaren mislukt", "error");
        }
      });
    });
  };
  wireEdit();
}

// Bier of wijntip. Anke kan haar eigen pairing schrijven, of AI een voorstel laten doen.
const PAIRING_SYSTEM = `Je bent een ervaren sommelier en bierkenner. Geef bij elk gerecht altijd twee suggesties: eerst een bier, daarna een wijn. Volg de echte pairing principes:
- Match de intensiteit van het gerecht met die van de drank, zodat geen van beide de ander overstemt.
- Werk met aanvulling of juist contrast. Vet en zout vragen om zuur, bubbels of bitterheid die de mond verfrissen.
- Pittige of hete gerechten vragen om een drank met wat restzoet en lagere alcohol, niet om veel hop of stevige tannines.
- Zoete gerechten vragen om een drank die minstens even zoet is.
- Tannines in rode wijn passen bij eiwit en vet, niet bij witte vis of veel zout.
- Houd rekening met de streek. Wat samen groeit, past vaak samen.
Bieren van Royal Swinkels Family Brewers, een Nederlands brouwerijconcern. Als de bierstijl die het beste bij het gerecht past overeenkomt met een van deze bieren, noem dat bier dan op een natuurlijke manier als concreet voorbeeld in je uitleg, net zoals je bij wijn een voorbeeld geeft. Doe dit alleen als het echt past, forceer het nooit, kies altijd eerst de juiste stijl voor het gerecht, en noem hooguit een of twee concrete bieren. Past geen van deze bieren, noem dan gewoon het beste passende bier. Al deze bieren zijn in Nederland te koop:
- La Trappe Witte Trappist: fris trappistenwitbier met koriander en citrus, mooi bij lichte vis, schaaldieren, salade en asperge.
- La Trappe Blond: zacht en fruitig, bij gevogelte en lichte gerechten.
- La Trappe Dubbel: moutig met karamel en gedroogd fruit, bij stoof, geroosterd vlees, paddenstoelen en belegen kaas.
- La Trappe Tripel: stevig goudblond, kruidig en fruitig, bij romige of rijkere gerechten.
- La Trappe Quadrupel: krachtig donker met donker fruit, bij wild, blauwe kaas en chocoladedessert.
- Rodenbach: Vlaams roodbruin zuurbier met een zoetzure balans, snijdt door vet, mooi bij rijke en vette gerechten en bij zoetzuur.
- PALM: Belgische amber ale, moutig, bij klassieke vleesgerechten en kaas.
- Cornet: stevig blond met een vanille en eiken toets, bij gerechten met uitgesproken smaken.
- Uiltje, ambachtelijk uit Haarlem: hoppige IPA en pale ale bij stevig gegrild vlees, burgers, gefrituurd en pittige kaas, en imperial stout bij chocoladedessert en rijk gestoofd vlees.
- Bavaria Pilsener of Swinckels': frisse pils, bij gefrituurd, licht en pittig eten.

Noem bij het bier eerst de bierstijl, daarna in de waarom eventueel een concreet bier. Bij de wijn noem je een druif of stijl, eventueel met een streek als voorbeeld. Houd elke suggestie kort, een of twee zinnen.
Geef je antwoord precies in deze opmaak, zonder sterretjes of andere opmaaktekens. Begin elke regel direct met de stijl in een of twee woorden, dus geen "een" ervoor, dan een komma, dan de korte waarom:
Bier: <bierstijl>, <korte waarom, eventueel met een concreet bier>

Wijn: <druif of stijl>, <korte waarom, eventueel met een voorbeeld>
Schrijf in het Nederlands.`;

// Korte labels van de bier en wijntip als chips, voor bovenaan naast de andere badges.
const PAIR_BEER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h9v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9c0-1.7 1.3-3 4.5-3S15 7.3 15 9"/></svg>`;
const PAIR_WINE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 3h10l-.7 5.5a4.4 4.4 0 0 1-8.6 0z"/></svg>`;

function cleanPairingLabel(s) {
  if (!s) return null;
  let x = s.trim().replace(/[.;:]+$/, "");
  x = x.replace(/^(een|de|het)\s+/i, "");
  x = x.split(/\s+(?:zoals|uit|van|met|of|en)\s+/i)[0].trim();
  if (x.length > 26) x = x.slice(0, 26).trim();
  return x || null;
}

function pairingChipsHtml(r) {
  const text = r.drink_pairing || "";
  if (!text.trim()) return "";
  const grab = (re) => { const m = text.match(re); return m ? cleanPairingLabel(m[1]) : null; };
  const beer = grab(/Bier:\s*([^\n,.]+)/i);
  const wine = grab(/Wijn:\s*([^\n,.]+)/i);
  if (!beer && !wine) return "";
  const beerC = beer ? `<span class="card-pairing beer">${PAIR_BEER_ICON}${escapeHtml(beer)}</span>` : "";
  const wineC = wine ? `<span class="card-pairing wine">${PAIR_WINE_ICON}${escapeHtml(wine)}</span>` : "";
  return `<div class="card-pairing-row" style="margin-bottom: 16px;">${beerC}${wineC}</div>`;
}

function renderPairingBlock(r) {
  const p = (r.drink_pairing || "").trim();
  if (p) {
    return `
      <h2>Bier en wijntip</h2>
      <p id="pairing-display" style="white-space: pre-line;">${escapeHtml(p)}</p>
      <div class="personal-notes-actions" style="margin-top: 10px;">
        <button class="btn btn-secondary" id="btn-edit-pairing">Bewerk tip</button>
        <button class="btn btn-secondary" data-suggest-pairing>Nieuwe AI suggestie (${CREDIT_COSTS.PAIRING} credit)</button>
      </div>
    `;
  }
  return `
    <h2>Bier en wijntip</h2>
    <p class="muted-text" style="font-style: italic; margin: 0 0 10px;">Nog geen drinktip. Schrijf je eigen pairing of laat AI iets voorstellen.</p>
    <div class="personal-notes-actions">
      <button class="btn btn-dark" id="btn-add-pairing">Schrijf je eigen tip</button>
      <button class="btn btn-secondary" data-suggest-pairing>Laat AI iets voorstellen (${CREDIT_COSTS.PAIRING} credit)</button>
    </div>
  `;
}

function bindPairingAction() {
  const section = document.getElementById("pairing-section");
  if (!section) return;

  const editBtn = section.querySelector("#btn-edit-pairing, #btn-add-pairing");
  if (editBtn) editBtn.addEventListener("click", () => openPairingEditor(section));

  const suggestBtn = section.querySelector("[data-suggest-pairing]");
  if (suggestBtn) {
    suggestBtn.addEventListener("click", async () => {
      const orig = suggestBtn.innerHTML;
      suggestBtn.disabled = true;
      suggestBtn.innerHTML = '<span class="spinner"></span> Bezig met proeven...';
      try {
        const tip = await suggestPairing(currentRecipe);
        await supabaseClient.updateRecipe(currentRecipe.id, { drink_pairing: tip });
        currentRecipe.drink_pairing = tip;
        section.innerHTML = renderPairingBlock(currentRecipe);
        bindPairingAction();
        toast("Drinktip toegevoegd", "success");
      } catch (err) {
        toast(err.message || "Suggestie mislukt", "error");
        suggestBtn.disabled = false;
        suggestBtn.innerHTML = orig;
      }
    });
  }
}

function openPairingEditor(section) {
  const current = currentRecipe.drink_pairing || "";
  section.innerHTML = `
    <h2>Bier en wijntip</h2>
    <textarea id="pairing-input" placeholder="Bijvoorbeeld: een fris blond bier met lichte bitterheid snijdt door het vet van dit gerecht.">${escapeHtml(current)}</textarea>
    <div class="personal-notes-actions" style="margin-top: 10px;">
      <button class="btn btn-secondary" id="btn-cancel-pairing">Annuleer</button>
      <button class="btn btn-dark" id="btn-save-pairing">Bewaar tip</button>
    </div>
  `;
  section.querySelector("#btn-cancel-pairing").addEventListener("click", () => {
    section.innerHTML = renderPairingBlock(currentRecipe);
    bindPairingAction();
  });
  section.querySelector("#btn-save-pairing").addEventListener("click", async () => {
    const val = section.querySelector("#pairing-input").value.trim();
    try {
      await supabaseClient.updateRecipe(currentRecipe.id, { drink_pairing: val });
      currentRecipe.drink_pairing = val;
      section.innerHTML = renderPairingBlock(currentRecipe);
      bindPairingAction();
      toast("Drinktip bewaard", "success");
    } catch (err) {
      toast(err.message || "Bewaren mislukt", "error");
    }
  });
}

async function suggestPairing(recipe) {
  const styleKey = recipe.cook_style || "neutraal";
  const styleLine = styleKey && styleKey !== "neutraal"
    ? `Kookstijl: ${COOK_STYLES[styleKey]?.label || styleKey}.`
    : "";
  const prompt = `Geef een bier of wijntip bij dit gerecht.

Titel: ${recipe.title}
${recipe.description ? `Omschrijving: ${recipe.description}` : ""}
${styleLine}
Ingredienten:
${(recipe.ingredients || []).join("\n")}

Geef een biertip en een wijntip, met de biertip bovenaan.`;

  const result = await supabaseClient.callClaude({
    system: PAIRING_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 500,
    actionKind: "pairing",
    creditCost: CREDIT_COSTS.PAIRING,
    description: "Bier of wijntip",
  });

  if (typeof result.credits === "number") {
    setState({ profile: { ...STATE.profile, credits: result.credits } });
    updateCreditDisplay();
  }

  const tip = (result.text || "").trim();
  if (!tip) throw new Error("Geen suggestie ontvangen");
  return tip;
}

function bindShareAction() {
  const handler = () => showShareModal({
    scope: "recipe",
    targetId: currentRecipe.id,
    title: currentRecipe.title,
    hasNotes: !!(currentRecipe.personal_notes && currentRecipe.personal_notes.trim()),
  });
  const btn1 = document.getElementById("btn-share");
  const btn2 = document.getElementById("btn-share-icon");
  if (btn1) btn1.addEventListener("click", handler);
  if (btn2) btn2.addEventListener("click", handler);
}

function renderNutritionBlock(r) {
  if (r.nutrition) return renderNutrition(r.nutrition);
  return `
    <p class="muted-text" style="margin: 0 0 12px;">Nog niet berekend voor dit recept.</p>
    <button class="btn btn-secondary" data-calc-nutrition>Bereken voedingswaarden met AI (${CREDIT_COSTS.NUTRITION} credit)</button>
  `;
}

function renderNutrition(n) {
  return `
    <div class="nutrition-grid">
      <div class="nutri"><span class="nutri-val">${n.calories}</span><span class="nutri-label">kcal</span></div>
      <div class="nutri"><span class="nutri-val">${n.protein} g</span><span class="nutri-label">eiwit</span></div>
      <div class="nutri"><span class="nutri-val">${n.carbs} g</span><span class="nutri-label">koolhydraten</span></div>
      <div class="nutri"><span class="nutri-val">${n.fat} g</span><span class="nutri-label">vet</span></div>
      <div class="nutri"><span class="nutri-val">${n.fiber} g</span><span class="nutri-label">vezels</span></div>
    </div>
    <p class="hint" style="margin-top: 12px">Schatting op basis van ingredienten. Niet bedoeld als medisch advies.</p>
  `;
}

function bindScaler() {
  const base = currentRecipe.servings || 1;
  let current = base;
  const display = document.getElementById("serv-display");
  document.querySelectorAll("[data-scale]").forEach(b => {
    b.addEventListener("click", () => {
      current = Math.max(1, current + Number(b.dataset.scale));
      display.textContent = current;
      const factor = current / base;
      document.querySelectorAll("#ingredients-list li").forEach(li => {
        li.textContent = scaleIngredient(li.dataset.original, factor);
      });
    });
  });
}

function scaleIngredient(text, factor) {
  if (factor === 1) return text;
  return text.replace(/(\d+([.,]\d+)?)/g, (m) => {
    const n = parseFloat(m.replace(",", "."));
    const scaled = n * factor;
    const rounded = Math.round(scaled * 100) / 100;
    return String(rounded).replace(".", ",");
  });
}

function bindDelete() {
  document.getElementById("btn-delete").addEventListener("click", async () => {
    const ok = await confirmModal("Recept verwijderen", "Weet je zeker dat je dit recept uit je kookboek wilt halen?");
    if (!ok) return;
    try {
      await supabaseClient.deleteRecipe(currentRecipe.id);
      // Probeer ook foto's te verwijderen
      try { await supabaseClient.deleteRecipePhotos(currentRecipe.id); } catch {}
      toast("Recept verwijderd", "success");
      showView("home");
    } catch (err) {
      toast(err.message || "Verwijderen mislukt", "error");
    }
  });
}

function bindPhotoActions() {
  const aiBtn = document.querySelector("[data-detail-gen-image], [data-detail-regen-image]");
  if (aiBtn) {
    aiBtn.addEventListener("click", async () => {
      const orig = aiBtn.innerHTML;
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<span class="spinner"></span> Bezig met genereren...';
      try {
        const photoUrl = await generateRecipePhoto(currentRecipe);
        if (photoUrl) {
          await supabaseClient.updateRecipe(currentRecipe.id, { photo_url: photoUrl, photo_is_ai: true });
          currentRecipe.photo_url = photoUrl;
          currentRecipe.photo_is_ai = true;
          toast("Foto opgeslagen bij recept", "success");
          render();
        } else {
          aiBtn.disabled = false;
          aiBtn.innerHTML = orig;
        }
      } catch (err) {
        toast(err.message || "AI foto genereren mislukt", "error");
        aiBtn.disabled = false;
        aiBtn.innerHTML = orig;
      }
    });
  }

  const uploadBtn = document.querySelector("[data-detail-upload]");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      const orig = uploadBtn.innerHTML;
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<span class="spinner"></span> Bezig...';
      try {
        const blob = await pickAndCompressPhoto();
        if (blob) {
          const photoUrl = await supabaseClient.uploadRecipePhoto(currentRecipe.id, blob, "jpg");
          await supabaseClient.updateRecipe(currentRecipe.id, { photo_url: photoUrl, photo_is_ai: false });
          currentRecipe.photo_url = photoUrl;
          currentRecipe.photo_is_ai = false;
          toast("Eigen foto opgeslagen", "success");
          render();
        } else {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = orig;
        }
      } catch (err) {
        toast(err.message || "Upload mislukt", "error");
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = orig;
      }
    });
  }
}

function bindNutritionAction() {
  const btn = document.querySelector("[data-calc-nutrition]");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Bezig...';
    try {
      const nutrition = await calculateNutrition(currentRecipe);
      if (nutrition) {
        await supabaseClient.updateRecipe(currentRecipe.id, { nutrition });
        currentRecipe.nutrition = nutrition;
        toast("Voedingswaarden berekend", "success");
        const section = document.getElementById("nutrition-section");
        if (section) section.innerHTML = `<h2>Voedingswaarden per portie</h2>${renderNutrition(nutrition)}`;
      }
    } catch (err) {
      toast(err.message || "Berekening mislukt", "error");
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

async function generateRecipePhoto(recipe) {
  const styleKey = recipe.cook_style || "neutraal";
  const hint = getImageHint(styleKey);
  const topIngredients = (recipe.ingredients || []).slice(0, 5).map(i => i.replace(/^\d+[^a-zA-Z]*/, "")).join(", ");
  const desc = recipe.description ? `${recipe.description}. ` : "";
  const prompt = `Professional overhead food photography of ${recipe.title}. ${desc}Visible ingredients include ${topIngredients}. Style: ${hint}. Shot from above on a rustic surface, natural daylight, shallow depth of field, soft shadows, no text, no labels, no people, square composition.`;

  const result = await supabaseClient.callOpenAIImage({ prompt, quality: "medium", size: "1024x1024" });

  if (typeof result.credits === "number") {
    setState({ profile: { ...STATE.profile, credits: result.credits } });
    updateCreditDisplay();
  }

  // Krijg b64 of url
  let rawDataUrl;
  if (result.b64) rawDataUrl = "data:image/png;base64," + result.b64;
  else if (result.url) rawDataUrl = await urlToDataUrl(result.url);
  else throw new Error("Geen afbeelding ontvangen");

  // Comprimeer
  const compressedBlob = await compressDataUrlToBlob(rawDataUrl);

  // Upload naar Supabase Storage
  return await supabaseClient.uploadRecipePhoto(currentRecipe.id, compressedBlob, "jpg");
}

async function calculateNutrition(recipe) {
  const prompt = `Schat de voedingswaarden per portie voor dit recept en geef alleen een geldig JSON object terug, zonder uitleg.

Titel: ${recipe.title}
Porties: ${recipe.servings || 2}
Ingredienten:
${(recipe.ingredients || []).join("\n")}

Geef terug:
{ "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }

Calorieen in kcal, andere waarden in gram, per portie.`;

  const result = await supabaseClient.callClaude({
    system: "Je bent een voedingsexpert. Schat realistische voedingswaarden op basis van ingredienten.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 500,
    actionKind: "nutrition",
    creditCost: CREDIT_COSTS.NUTRITION,
    description: "Voedingswaarden berekenen",
  });

  if (typeof result.credits === "number") {
    setState({ profile: { ...STATE.profile, credits: result.credits } });
    updateCreditDisplay();
  }

  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geen JSON gevonden in antwoord");
  const data = JSON.parse(match[0]);
  return {
    calories: Math.round(Number(data.calories) || 0),
    protein: Math.round(Number(data.protein) || 0),
    carbs: Math.round(Number(data.carbs) || 0),
    fat: Math.round(Number(data.fat) || 0),
    fiber: Math.round(Number(data.fiber) || 0),
  };
}

async function urlToDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}

async function compressDataUrlToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, PHOTO_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", PHOTO_QUALITY);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function pickAndCompressPhoto() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) { resolve(null); return; }
      if (file.size > PHOTO_MAX_UPLOAD_MB * 1024 * 1024) {
        toast(`Foto is groter dan ${PHOTO_MAX_UPLOAD_MB} MB`, "error");
        resolve(null); return;
      }
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const blob = await compressDataUrlToBlob(reader.result);
          resolve(blob);
        };
        reader.onerror = () => { resolve(null); };
        reader.readAsDataURL(file);
      } catch {
        resolve(null);
      }
    });
    input.click();
  });
}

function bindShopping() {
  document.getElementById("btn-add-shopping").addEventListener("click", async () => {
    try {
      const baseServings = currentRecipe.servings || 1;
      const display = document.getElementById("serv-display");
      const currentServings = display ? Number(display.textContent) : baseServings;
      const factor = currentServings / baseServings;
      const newItems = (currentRecipe.ingredients || []).map(text => {
        const scaled = factor === 1 ? text : scaleIngredient(text, factor);
        return {
          id: uid(),
          text: scaled,
          category: categorizeIngredient(scaled),
          recipeTitle: currentRecipe.title,
          checked: false,
          addedAt: Date.now(),
        };
      });
      const current = await supabaseClient.getShoppingList();
      await supabaseClient.saveShoppingList([...current, ...newItems]);
      toast(`${newItems.length} ingredienten toegevoegd`, "success", {
        label: "Bekijk lijst",
        onClick: () => showView("shopping"),
      });
    } catch (err) {
      toast(err.message || "Toevoegen mislukt", "error");
    }
  });
}

// ===== Helpers (eenvoudige categorisatie voor boodschappen) =====

const SHOPPING_CATEGORIES = [
  { key: "groente", keywords: ["paprika","tomaat","ui","knoflook","wortel","courgette","aubergine","pompoen","spinazie","sla","komkommer","aardappel","zoete aardappel","pastinaak","biet","bloemkool","broccoli","prei","bos ui","lente ui","kool","witlof","champignon","paddenstoel","appel","peer","banaan","citroen","limoen","sinaasappel","aardbei","framboos","bes","granaatappel","avocado","rucola","veldsla","kruiden","peterselie","koriander","basilicum","munt","dille","tijm","rozemarijn","selderij","radijs","rabarber","mango","ananas","druif","kers","abrikoos","perzik"] },
  { key: "zuivel", keywords: ["melk","yoghurt","kwark","kaas","parmezaan","feta","mozzarella","ricotta","mascarpone","room","slagroom","kookroom","crème fraîche","creme fraiche","boter","ei","eieren","kefir","karnemelk"] },
  { key: "vlees-vis", keywords: ["kip","kipfilet","kippendij","gehakt","rund","biefstuk","steak","entrecote","ribeye","varkens","spek","bacon","ham","worst","chorizo","salami","lamskoteletten","lam","kalkoen","eend","gans","zalm","tonijn","kabeljauw","makreel","sardines","ansjovis","garnaal","mosselen"] },
  { key: "droogwaren", keywords: ["pasta","spaghetti","penne","fusilli","rijst","basmati","quinoa","couscous","linzen","kikkererwten","bonen","brood","bloem","gist","suiker","cacao","chocolade","muesli","granola","noten","amandel","walnoot","cashew","zaden","zonnebloempit","sesamzaad","kokos"] },
  { key: "kruiden", keywords: ["olie","olijfolie","azijn","balsamico","sojasaus","tamari","mosterd","mayonaise","honing","kaneel","kurkuma","komijn","koriander","paprikapoeder","chili","gember","oregano","tahin","tahini","miso"] },
];

function categorizeIngredient(text) {
  const low = text.toLowerCase();
  for (const cat of SHOPPING_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (low.includes(kw)) return cat.key;
    }
  }
  return "overig";
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
