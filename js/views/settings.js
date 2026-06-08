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
        <div class="page-head">
          <div>
            <h1>Instellingen</h1>
            <p>Beheer je profiel, koop credits en deel je kookboek.</p>
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
            <h2 style="font-size: 22px; margin: 0 0 8px;">Credits</h2>
            <p style="margin: 0 0 16px;">Je hebt <strong>${p.credits ?? 0}</strong> credits. AI recept genereren kost 1 credit, foto inlezen 1 credit, AI foto 5 credits.</p>
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

          <div class="card-small">
            <h2>Voorbeeldrecepten</h2>
            <p>Vijf recepten cadeau om je kookboek te starten. Duplicaten worden overgeslagen.</p>
            <div class="form-actions">
              <button class="btn btn-secondary" id="btn-add-examples">Voeg voorbeeldrecepten toe</button>
            </div>
          </div>

          <div class="card-small">
            <h2>Account</h2>
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
