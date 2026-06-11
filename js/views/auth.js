// Auth view: inloggen of registreren met Google of een magische link per mail
// Geen wachtwoord meer. Nieuwe gebruikers vullen hun voornaam in tijdens de onboarding.

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";

let containerEl = null;
let sentToEmail = null; // null = invoerscherm, anders het mailadres waar de link heen is

export function mount(container) {
  containerEl = container;
  sentToEmail = null;
  render();
}

const GOOGLE_ICON = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>`;

function render() {
  if (sentToEmail) {
    renderSent();
    return;
  }

  containerEl.innerHTML = `
    <div class="auth-screen">
      <div class="card-auth auth-card">
        <div class="auth-header">
          <div class="brand-mark">K</div>
          <h1>Welkom bij Mijn Kookboek</h1>
          <p>Log in of maak je kookboek. Nieuw hier? Je krijgt 10 gratis credits om te ontdekken.</p>
        </div>

        <button type="button" class="btn btn-google btn-full btn-lg" id="btn-google">
          ${GOOGLE_ICON}
          <span>Doorgaan met Google</span>
        </button>

        <div class="auth-divider"><span>of met je mailadres</span></div>

        <form id="auth-form" class="stack">
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="naam@voorbeeld.nl">
          </div>
          <button type="submit" class="btn btn-secondary btn-full btn-lg" id="auth-submit">
            Stuur me een inloglink
          </button>
          <p class="hint text-center">Je krijgt een mailtje met een knop. Geen wachtwoord onthouden.</p>
        </form>

        <p class="auth-legal">
          Door door te gaan ga je akkoord met onze
          <a href="voorwaarden.html" target="_blank">algemene voorwaarden</a>
          en <a href="privacy.html" target="_blank">privacyverklaring</a>.
        </p>

        <p class="auth-footer-links">
          <a href="voorwaarden.html" target="_blank">Voorwaarden</a>
          <span>·</span>
          <a href="privacy.html" target="_blank">Privacy</a>
          <span>·</span>
          <a href="mailto:info@mijndigitaalkookboek.nl">Contact</a>
        </p>
      </div>
    </div>
  `;

  containerEl.querySelector("#btn-google").addEventListener("click", handleGoogle);
  containerEl.querySelector("#auth-form").addEventListener("submit", handleMagicLink);
}

function renderSent() {
  containerEl.innerHTML = `
    <div class="auth-screen">
      <div class="card-auth auth-card">
        <div class="auth-sent">
          <div class="auth-sent-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
          </div>
          <h1>Check je mail</h1>
          <p>We hebben een inloglink gestuurd naar <strong>${escapeHtml(sentToEmail)}</strong>. Open de mail en tik op de knop om in te loggen.</p>
          <p class="hint">Niets gezien? Kijk even in je spam of ongewenste mail. De link is een uur geldig.</p>
          <button type="button" class="btn btn-secondary btn-full" id="btn-back">Ander mailadres gebruiken</button>
        </div>

        <p class="auth-footer-links">
          <a href="voorwaarden.html" target="_blank">Voorwaarden</a>
          <span>·</span>
          <a href="privacy.html" target="_blank">Privacy</a>
          <span>·</span>
          <a href="mailto:info@mijndigitaalkookboek.nl">Contact</a>
        </p>
      </div>
    </div>
  `;

  containerEl.querySelector("#btn-back").addEventListener("click", () => {
    sentToEmail = null;
    render();
  });
}

async function handleGoogle() {
  const btn = containerEl.querySelector("#btn-google");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig met Google...';
  try {
    await supabaseClient.signInWithGoogle();
    // Bij succes stuurt Supabase de browser door naar Google, deze pagina verdwijnt
  } catch (err) {
    toast(parseAuthError(err), "error");
    btn.disabled = false;
    render();
  }
}

async function handleMagicLink(e) {
  e.preventDefault();
  const submit = containerEl.querySelector("#auth-submit");
  const origLabel = submit.textContent;
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> Versturen...';

  const email = e.target.email.value.trim();

  try {
    await supabaseClient.signInWithMagicLink(email);
    sentToEmail = email;
    render();
  } catch (err) {
    toast(parseAuthError(err), "error");
    submit.disabled = false;
    submit.textContent = origLabel;
  }
}

function parseAuthError(err) {
  const msg = err?.message || String(err);
  if (msg.includes("rate limit") || msg.includes("Email rate")) return "Je hebt net al een link aangevraagd. Wacht even en probeer opnieuw.";
  if (msg.includes("Invalid email") || msg.includes("valid email")) return "Dat lijkt geen geldig mailadres.";
  if (msg.includes("popup") || msg.includes("provider is not enabled")) return "Google inloggen is nog niet ingeschakeld. Probeer de inloglink per mail.";
  return msg;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
