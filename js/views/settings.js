// Instellingen view: profiel, credits, delen, voorbeeldrecepten, account

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { addExampleRecipesToCurrentUser } from "./onboarding.js";
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
        <div class="page-hero">
          <div class="page-hero-icon tint-cream"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
          <div class="page-hero-text">
            <h1>Instellingen</h1>
            <p>Beheer je profiel, koop credits en deel je kookboek.</p>
          </div>
        </div>

        <div class="stack xl" style="max-width: 720px">

          <div class="card-feature">
            <div class="setting-head"><div class="setting-icon tint-mint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><h2>Profiel</h2></div>
            <form id="form-profile" class="form-grid">
              <div class="field">
                <label>Voornaam</label>
                <input type="text" name="firstName" value="${escapeAttr(p.first_name || "")}" required />
              </div>
              <div class="field">
                <label>Naam van je kookboek</label>
                <input type="text" name="cookbookName" value="${escapeAttr(p.cookbook_name || "")}" />
                <p class="hint">Verschijnt boven je kookboek en bij gedeelde links.</p>
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

          <div class="card-feature tint-yellow-bold">
            <div class="setting-head"><div class="setting-icon tint-lavender"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M21 12h-6a2 2 0 0 0 0 4h6v-4z"/></svg></div><h2>Credits</h2></div>
            <p style="margin: 0 0 16px;">Je hebt <strong>${p.credits ?? 0}</strong> credits. AI recept genereren kost 1 credit, foto inlezen 1 credit, AI foto 5 credits.</p>
            <div class="form-actions">
              <button class="btn btn-dark" data-nav="credits">Koop credits</button>
            </div>
          </div>

          <div class="card-feature tint-lavender">
            <div class="setting-head"><div class="setting-icon tint-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div><h2>Deel je kookboek</h2></div>
            <p style="margin: 0 0 16px;">Maak een publieke link aan zodat vrienden en familie je hele kookboek kunnen lezen. Geen account nodig om te bekijken.</p>
            <div class="form-actions">
              <button class="btn btn-dark" id="btn-share-cookbook">Genereer deellink</button>
            </div>
          </div>

          <div class="card-small">
            <div class="setting-head"><div class="setting-icon tint-sky"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><h2>Voorbeeldrecepten</h2></div>
            <p>Vijf recepten cadeau om je kookboek te starten. Duplicaten worden overgeslagen.</p>
            <div class="form-actions">
              <button class="btn btn-secondary" id="btn-add-examples">Voeg voorbeeldrecepten toe</button>
            </div>
          </div>

          <div class="card-small">
            <div class="setting-head"><div class="setting-icon tint-cream"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div><h2>Account</h2></div>
            <p>Uitloggen sluit je sessie. Je kunt altijd opnieuw inloggen.</p>
            <div class="form-actions">
              <button class="btn btn-secondary" id="btn-logout">Uitloggen</button>
            </div>
          </div>

        </div>
      </div>
    </section>
  `;

  bindEvents();
}

function bindEvents() {
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
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
