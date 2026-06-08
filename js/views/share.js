// Publieke share view voor gedeelde recepten of kookboeken
// Wordt geactiveerd door een ?share=slug URL parameter
// Geen login nodig om te lezen

import * as supabaseClient from "../storage/supabase-client.js";
import { STATE } from "../state.js";
import { toast } from "../components/toast.js";
import { getDisplayCookStyle } from "../data/cook-styles.js";
import { getDiet } from "../data/categories.js";

let containerEl = null;
let shareData = null;

export async function mount(container, params) {
  containerEl = container;
  const slug = params?.slug;
  if (!slug) {
    showError("Geen geldige deellink");
    return;
  }

  containerEl.innerHTML = `<div class="share-screen"><div class="container" style="padding: 64px 16px; text-align: center;"><p class="muted-text"><span class="spinner"></span> Even het kookboek laden...</p></div></div>`;

  try {
    shareData = await supabaseClient.readShareLink(slug);
    render();
  } catch (err) {
    showError(err.message || "Deze link werkt niet meer");
  }
}

function showError(msg) {
  containerEl.innerHTML = `
    <div class="share-screen">
      <div class="container" style="padding: 64px 16px; text-align: center; max-width: 540px; margin: 0 auto;">
        <div class="brand-mark" style="width: 56px; height: 56px; font-size: 28px; margin: 0 auto 16px; border-radius: 12px;">K</div>
        <h1 style="font-size: 28px; margin: 0 0 8px;">Oeps</h1>
        <p class="muted-text" style="margin-bottom: 24px;">${escapeHtml(msg)}</p>
        <a href="/" class="btn btn-primary">Naar de homepage</a>
      </div>
    </div>
  `;
}

function render() {
  const { scope, owner, recipes } = shareData;

  if (scope === "recipe") {
    renderRecipeShare(recipes[0], owner);
  } else if (scope === "cookbook") {
    renderCookbookShare(recipes, owner);
  }
}

function renderRecipeShare(r, owner) {
  if (!r) { showError("Recept niet meer beschikbaar"); return; }

  const displayStyle = getDisplayCookStyle(r.cook_style);
  const tagColors = ["tag-purple", "tag-orange", "tag-green", "tag-sky"];

  containerEl.innerHTML = `
    <div class="share-screen">
      <nav class="topnav">
        <div class="brand">
          <div class="brand-mark">K</div>
          <span>Mijn Digitaal Kookboek</span>
        </div>
        <div style="margin-left: auto;">
          <a href="/" class="btn btn-primary">Maak je eigen kookboek</a>
        </div>
      </nav>

      <section class="block">
        <div class="container">
          <div class="share-banner">
            <p><strong>${escapeHtml(owner.firstName)}</strong> deelt dit recept met je uit "${escapeHtml(owner.cookbookName)}".</p>
          </div>

          <div class="recipe-detail" style="padding-top: var(--s-xl);">
            <div>
              ${r.photo_url
                ? `<div class="photo" style="background-image:url('${r.photo_url}')"></div>`
                : `<div class="photo">Geen foto</div>`}
            </div>
            <div>
              ${displayStyle ? `
                <div class="style-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;">
                  <span class="badge badge-purple">In de stijl van ${escapeHtml(displayStyle.primary)}</span>
                  ${displayStyle.stylistTag ? `<span class="badge badge-stylist">${escapeHtml(displayStyle.stylistTag)}</span>` : ""}
                </div>
              ` : ""}

              <h1>${escapeHtml(r.title)}</h1>
              <p style="color: var(--slate); margin: 0 0 16px; font-size: 18px;">${escapeHtml(r.description || "")}</p>

              <div class="recipe-meta-row">
                ${r.cook_time ? `<span class="meta-pill">${r.cook_time} min</span>` : ""}
                ${r.meal_type ? `<span class="meta-pill">${escapeHtml(r.meal_type)}</span>` : ""}
                ${(r.dish_type || []).map(d => `<span class="meta-pill">${escapeHtml(d)}</span>`).join("")}
                ${r.servings ? `<span class="meta-pill">${r.servings} porties</span>` : ""}
              </div>

              ${(r.diet && r.diet.length) ? `<div class="diet-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">${r.diet.map(k => {
                const d = getDiet(k);
                return d ? `<span class="diet-badge tint-${d.color}">${d.icon} ${escapeHtml(d.label)}</span>` : "";
              }).join("")}</div>` : ""}

              ${(r.tags && r.tags.length) ? `<div class="recipe-tags" style="margin-bottom: 16px">${(r.tags || []).map((t, i) => `<span class="tag-chip ${tagColors[i % 4]}">${escapeHtml(t)}</span>`).join("")}</div>` : ""}

              <div class="recipe-section ingredients">
                <h2>Ingredienten</h2>
                <ul>
                  ${(r.ingredients || []).map(i => `<li>${escapeHtml(i)}</li>`).join("")}
                </ul>
              </div>

              <div class="recipe-section instructions">
                <h2>Bereiding</h2>
                <ol>
                  ${(r.instructions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                </ol>
              </div>

              ${r.tips ? `<div class="recipe-section"><h2>Tip</h2><p>${escapeHtml(r.tips)}</p></div>` : ""}

              ${r.nutrition ? `
                <div class="recipe-section">
                  <h2>Voedingswaarden per portie</h2>
                  <div class="nutrition-grid">
                    <div class="nutri"><span class="nutri-val">${r.nutrition.calories}</span><span class="nutri-label">kcal</span></div>
                    <div class="nutri"><span class="nutri-val">${r.nutrition.protein} g</span><span class="nutri-label">eiwit</span></div>
                    <div class="nutri"><span class="nutri-val">${r.nutrition.carbs} g</span><span class="nutri-label">koolhydraten</span></div>
                    <div class="nutri"><span class="nutri-val">${r.nutrition.fat} g</span><span class="nutri-label">vet</span></div>
                    <div class="nutri"><span class="nutri-val">${r.nutrition.fiber} g</span><span class="nutri-label">vezels</span></div>
                  </div>
                </div>
              ` : ""}

              <div class="card-feature tint-mint" style="margin-top: 32px;">
                <h3 style="margin: 0 0 8px;">Vind je dit recept lekker?</h3>
                <p style="margin: 0 0 16px;">Maak je eigen kookboek met AI hulp, foto inlezen en alle recepten op één plek.</p>
                <a href="/" class="btn btn-primary">Begin met je eigen kookboek</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderCookbookShare(recipes, owner) {
  const tagColors = ["tag-purple", "tag-orange", "tag-green", "tag-sky"];

  containerEl.innerHTML = `
    <div class="share-screen">
      <nav class="topnav">
        <div class="brand">
          <div class="brand-mark">K</div>
          <span>Mijn Digitaal Kookboek</span>
        </div>
        <div style="margin-left: auto;">
          <a href="/" class="btn btn-primary">Maak je eigen kookboek</a>
        </div>
      </nav>

      <section class="block">
        <div class="container">
          <div class="page-head">
            <div>
              <h1>${escapeHtml(owner.cookbookName)}</h1>
              <p>Een kookboek van ${escapeHtml(owner.firstName)} met ${recipes.length} ${recipes.length === 1 ? "recept" : "recepten"}</p>
            </div>
          </div>

          <div class="recipe-grid">
            ${recipes.map(r => {
              const photoUrl = r.photo_url || "";
              const displayStyle = getDisplayCookStyle(r.cook_style);
              return `
                <div class="recipe-card" data-recipe-id="${r.id}">
                  <div class="recipe-image ${photoUrl ? "" : "placeholder"}" ${photoUrl ? `style="background-image:url('${photoUrl}')"` : ""}>
                    ${photoUrl ? "" : (r.meal_type || "Recept")}
                  </div>
                  <div class="recipe-body">
                    <h3 class="recipe-title">${escapeHtml(r.title)}</h3>
                    ${displayStyle ? `<div class="card-style-line"><span class="card-style-text">In de stijl van ${escapeHtml(displayStyle.primary)}</span></div>` : ""}
                    <div class="card-meta-line">
                      ${r.cook_time ? `${r.cook_time} min · ` : ""}
                      ${r.meal_type || ""}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <div class="card-feature tint-mint" style="margin-top: 48px; text-align: center;">
            <h3 style="margin: 0 0 8px;">Wil je ook een kookboek?</h3>
            <p style="margin: 0 0 16px;">Maak je eigen kookboek met AI hulp, foto inlezen en alle recepten op één plek.</p>
            <a href="/" class="btn btn-primary">Begin met je eigen kookboek</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
