// Credits kopen view: drie pakketten, klik leidt naar Mollie checkout

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { CREDIT_PACKAGES, CREDIT_COSTS } from "../config.js";

let containerEl = null;

export async function mount(container) {
  containerEl = container;
  updateActiveNav("settings");
  render();
}

function render() {
  const credits = STATE.profile?.credits ?? 0;
  containerEl.innerHTML = `
    <section class="block">
      <div class="container">
        <div class="page-head">
          <div>
            <h1>Credits</h1>
            <p>Je hebt nu <strong>${credits}</strong> credits. Koop er meer om recepten te blijven genereren.</p>
          </div>
          <button class="btn btn-ghost" data-nav="settings">Terug naar instellingen</button>
        </div>

        <div class="credits-explainer">
          <h3>Wat kost wat?</h3>
          <ul>
            <li>Recept genereren met AI: ${CREDIT_COSTS.GENERATE} credit</li>
            <li>Foto inlezen: ${CREDIT_COSTS.VISION} credit</li>
            <li>Voedingswaarden berekenen: ${CREDIT_COSTS.NUTRITION} credit</li>
            <li>AI foto bij recept genereren: ${CREDIT_COSTS.AI_PHOTO} credits</li>
          </ul>
        </div>

        <h2 style="margin-top: 48px; margin-bottom: 24px;">Kies je pakket</h2>
        <div class="credits-grid">
          ${CREDIT_PACKAGES.map(pkg => `
            <div class="credit-package ${pkg.id === 'populair' ? 'featured' : ''}">
              ${pkg.id === 'populair' ? '<span class="badge badge-purple" style="margin-bottom: 12px;">Meest gekozen</span>' : ''}
              <h3>${pkg.label}</h3>
              <div class="credit-amount">
                <span class="credit-number">${pkg.credits}</span>
                <span class="credit-label">credits</span>
              </div>
              <div class="credit-price">
                <span class="price-euro">€${pkg.priceEur.toFixed(2).replace('.', ',')}</span>
                <span class="price-per">${(pkg.priceEur / pkg.credits).toFixed(2).replace('.', ',')} per credit</span>
              </div>
              <button class="btn ${pkg.id === 'populair' ? 'btn-primary' : 'btn-dark'} btn-full" data-buy-package="${pkg.id}">Koop ${pkg.label}</button>
            </div>
          `).join("")}
        </div>

        <p class="muted-text text-center" style="margin-top: 32px;">Veilig betalen via Mollie. iDEAL, creditcard, Bancontact en meer.</p>
      </div>
    </section>
  `;

  containerEl.querySelectorAll("[data-buy-package]").forEach(btn => {
    btn.addEventListener("click", () => handleBuy(btn.dataset.buyPackage, btn));
  });
}

async function handleBuy(packageId, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig...';
  try {
    const result = await supabaseClient.createPayment({ package: packageId });
    if (!result?.checkoutUrl) {
      throw new Error("Geen checkout URL ontvangen");
    }
    // Redirect naar Mollie checkout
    window.location.href = result.checkoutUrl;
  } catch (err) {
    toast(err.message || "Betaling starten mislukt", "error");
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}
