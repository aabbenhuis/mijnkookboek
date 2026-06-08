// Instellingen view: profiel, migratie van v1, uitloggen

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { confirmModal } from "../components/modal.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { addExampleRecipesToCurrentUser, generateSeedPhotos } from "./onboarding.js";
import { populateCookStyleDropdown } from "../data/cook-styles.js";
import { showShareModal } from "../components/share-modal.js";

let containerEl = null;

export async function mount(container) {
  containerEl = container;
  updateActiveNav("settings");
  render();
}

function render() {
  const p = STATE.profile || {};

  containerEl.innerHTML = `
    <section class="block">
      <div class="container">
        <div class="page-head">
          <div>
            <h1>Instellingen</h1>
            <p>Beheer je profiel, importeer je oude kookboek of log uit.</p>
          </div>
        </div>

        <div class="stack xl" style="max-width: 720px">

          <div class="card-feature">
            <h2 style="font-size: 22px; margin: 0 0 16px;">Profiel</h2>
            <form id="form-profile" class="form-grid">
              <div class="field">
                <label>Voornaam</label>
                <input type="text" name="firstName" value="${escapeAttr(p.first_name || "")}" required />
              </div>
              <div class="field">
                <label>Naam van je kookboek</label>
                <input type="text" name="cookbookName" value="${escapeAttr(p.cookbook_name || "")}" />
                <p class="hint">Verschijnt straks op je PDF cover en bij gedeelde links.</p>
              </div>
              <div class="field">
                <label>Jouw favoriete kok</label>
                <select name="defaultCookStyle" id="default-cook-style"></select>
                <p class="hint">Jouw voorkeur, opgeslagen in je profiel. Bij nieuwe AI gegenereerde recepten staat deze standaard ingevuld. Je kunt per recept iets anders kiezen.</p>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Bewaar profiel</button>
              </div>
            </form>
          </div>

          <div class="card-feature tint-mint">
            <h2 style="font-size: 22px; margin: 0 0 8px;">Voorbeeldrecepten</h2>
            <p style="margin: 0 0 16px;">Vijf recepten cadeau om je kookboek te starten: PokéBowl, Kip Noedelsoep, Pulled Pork Bowl, Bloemkool met Tahin en Hollandse Zuurkoolschotel.</p>
            <div class="form-actions">
              <button class="btn btn-dark" id="btn-add-examples">Voeg voorbeeldrecepten toe</button>
            </div>
            <p class="hint" style="margin-top: 12px">Duplicaten worden automatisch herkend en overgeslagen.</p>
          </div>

          <div class="card-feature tint-yellow-bold">
            <h2 style="font-size: 22px; margin: 0 0 8px;">Admin: voorbeeldfoto's genereren</h2>
            <p style="margin: 0 0 16px;">Eenmalig genereert AI mooie foto's voor de vijf voorbeeldrecepten en slaat ze centraal op. Iedere nieuwe gebruiker krijgt daarna deze foto's automatisch zonder credits.</p>
            <div class="form-actions">
              <button class="btn btn-dark" id="btn-gen-seed-photos">Genereer voorbeeldfoto's (25 credits)</button>
            </div>
            <p class="hint" style="margin-top: 12px">Alleen jij doet dit, eenmalig. Bestaande foto's worden overgeslagen.</p>
            <div id="seed-progress" style="margin-top: 16px;"></div>
          </div>

          <div class="card-feature tint-yellow-bold">
            <h2 style="font-size: 22px; margin: 0 0 8px;">Credits</h2>
            <p style="margin: 0 0 16px;">Je hebt <strong>${p.credits ?? 0}</strong> credits. AI generatie kost 1 credit, foto inlezen 1 credit, AI foto 5 credits.</p>
            <div class="form-actions">
              <button class="btn btn-dark" data-nav="credits">Koop credits</button>
            </div>
          </div>

          <div class="card-feature tint-lavender">
            <h2 style="font-size: 22px; margin: 0 0 8px;">Deel je kookboek</h2>
            <p style="margin: 0 0 16px;">Maak een publieke link aan zodat vrienden en familie je hele kookboek kunnen lezen. Geen account nodig om te bekijken.</p>
            <div class="form-actions">
              <button class="btn btn-dark" id="btn-share-cookbook">Genereer deellink</button>
            </div>
          </div>

          <div class="card-feature">
            <h2 style="font-size: 22px; margin: 0 0 16px;">Importeer je lokale kookboek</h2>
            <p class="muted-text" style="margin-bottom: 16px;">Had je in de lokale v1 versie al recepten staan? Importeer ze hier eenmalig naar je cloud account.</p>
            <p class="muted-text" style="margin-bottom: 16px;">Werkt door je v1 export bestand (een JSON bestand uit Instellingen, Exporteer kookboek van de lokale versie) hier te uploaden.</p>
            <div class="form-actions">
              <input type="file" id="import-input" accept="application/json" style="display:none" />
              <button class="btn btn-primary" id="btn-import">Kies JSON bestand</button>
            </div>
          </div>

          <div class="card-feature">
            <h2 style="font-size: 22px; margin: 0 0 16px;">Account</h2>
            <p class="muted-text" style="margin-bottom: 16px;">Uitloggen sluit je sessie. Je kunt altijd opnieuw inloggen met je email en wachtwoord.</p>
            <div class="form-actions">
              <button class="btn btn-secondary" id="btn-logout">Uitloggen</button>
            </div>
          </div>

          <div class="card-feature">
            <h2 style="font-size: 22px; margin: 0 0 16px;">Juridisch</h2>
            <p style="margin-bottom: 12px;">
              <a href="voorwaarden.html" target="_blank" class="btn-link">Algemene voorwaarden</a>
            </p>
            <p style="margin-bottom: 12px;">
              <a href="privacy.html" target="_blank" class="btn-link">Privacyverklaring</a>
            </p>
            <p style="margin: 0;">
              <a href="mailto:info@mijndigitaalkookboek.nl" class="btn-link">Contact: info@mijndigitaalkookboek.nl</a>
            </p>
          </div>

        </div>
      </div>
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  // Vul de kookstijl dropdown met huidige voorkeur
  const styleSelect = document.getElementById("default-cook-style");
  if (styleSelect) populateCookStyleDropdown(styleSelect, STATE.profile?.default_cook_style || "neutraal");

  document.getElementById("form-profile").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const updated = await supabaseClient.updateProfile({
        first_name: (fd.get("firstName") || "").trim(),
        cookbook_name: (fd.get("cookbookName") || "Mijn Kookboek").trim(),
        default_cook_style: fd.get("defaultCookStyle") || "neutraal",
      });
      setState({ profile: updated });
      toast("Profiel bewaard", "success");
    } catch (err) {
      toast(err.message || "Bewaren mislukt", "error");
    }
  });

  document.getElementById("btn-add-examples")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-add-examples");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Bezig...';
    try {
      const { added, skipped } = await addExampleRecipesToCurrentUser();
      let msg;
      if (added === 0 && skipped > 0) msg = `Je had alle voorbeeldrecepten al, niets toegevoegd`;
      else if (skipped > 0) msg = `${added} toegevoegd, ${skipped} stonden er al`;
      else msg = `${added} voorbeeldrecepten toegevoegd aan je kookboek`;
      toast(msg, added > 0 ? "success" : "", added > 0 ? { label: "Bekijk", onClick: () => showView("home") } : null);
    } catch (err) {
      toast(err.message || "Toevoegen mislukt", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  document.getElementById("btn-gen-seed-photos")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-gen-seed-photos");
    const progressEl = document.getElementById("seed-progress");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Bezig met genereren...';
    progressEl.innerHTML = "";
    try {
      const results = await generateSeedPhotos((p) => {
        const labels = { starting: "voorbereiden", generating: "genereren", done: "klaar", skipped: "bestond al", error: "mislukt" };
        progressEl.innerHTML = `<p class="muted-text">Recept ${p.index + 1} van ${p.total}: <strong>${escapeAttr(p.slug)}</strong> ${labels[p.status] || p.status}</p>`;
      });
      const done = results.filter(r => r.status === "done").length;
      const skipped = results.filter(r => r.status === "skipped").length;
      const errors = results.filter(r => r.status === "error").length;
      let msg = `${done} foto's gegenereerd`;
      if (skipped) msg += `, ${skipped} bestonden al`;
      if (errors) msg += `, ${errors} mislukten`;
      toast(msg, errors ? "error" : "success");
      progressEl.innerHTML = `<p class="muted-text">${escapeAttr(msg)}. Nieuwe gebruikers krijgen vanaf nu deze foto's automatisch bij hun voorbeeldrecepten.</p>`;
    } catch (err) {
      toast(err.message || "Genereren mislukt", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  document.getElementById("btn-share-cookbook")?.addEventListener("click", () => {
    showShareModal({ scope: "cookbook", title: STATE.profile?.cookbook_name || "Mijn Kookboek" });
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
      await supabaseClient.signOut();
    } catch (err) {
      toast(err.message || "Uitloggen mislukt", "error");
    }
  });

  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-input").click();
  });

  document.getElementById("import-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.recipes)) throw new Error("Geen recepten in dit bestand gevonden");
      const ok = await confirmModal("Importeren", `${data.recipes.length} recepten gevonden. Toevoegen aan je cloud kookboek?`);
      if (!ok) return;
      let success = 0;
      let failed = 0;
      for (const r of data.recipes) {
        try {
          await supabaseClient.createRecipe({
            title: r.title || "Naamloos recept",
            description: r.description || "",
            cook_time: Number(r.cookTime) || null,
            servings: Number(r.servings) || null,
            category: r.category || "Anders",
            tags: Array.isArray(r.tags) ? r.tags : [],
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            instructions: Array.isArray(r.instructions) ? r.instructions : [],
            tips: r.tips || "",
            photo_url: r.photoUrl?.startsWith("data:") ? "" : (r.photoUrl || ""),
            nutrition: r.nutrition || null,
            cook_style: r.cookStyle || "neutraal",
            source: r.source || "imported",
            language: r.language || "nl",
          });
          success++;
        } catch (err) {
          console.error("Recipe import failed:", err);
          failed++;
        }
      }
      const msg = failed
        ? `${success} recepten geïmporteerd, ${failed} mislukt`
        : `${success} recepten geïmporteerd`;
      toast(msg, failed ? "" : "success");
    } catch (err) {
      toast("Import mislukt: " + err.message, "error");
    } finally {
      e.target.value = "";
    }
  });
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
