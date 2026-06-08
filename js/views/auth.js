// Auth view: registratie, login, wachtwoord reset

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";

let containerEl = null;
let mode = "signin"; // signin, signup, reset

export function mount(container) {
  containerEl = container;
  render();
}

function render() {
  const isSignup = mode === "signup";
  const isReset = mode === "reset";

  containerEl.innerHTML = `
    <div class="auth-screen">
      <div class="card-auth auth-card">
        <div class="auth-header">
          <div class="brand-mark">K</div>
          <h1>${isReset ? "Wachtwoord vergeten" : isSignup ? "Maak je kookboek" : "Welkom terug"}</h1>
          <p>${
            isReset
              ? "Vul je email in, dan sturen we je een herstellink."
              : isSignup
                ? "Begin met je eigen digitale kookboek. 10 gratis credits om te ontdekken."
                : "Log in om je kookboek te openen."
          }</p>
        </div>

        <form id="auth-form" class="stack">
          ${isSignup ? `
            <div class="field">
              <label for="first-name">Je voornaam</label>
              <input type="text" id="first-name" name="firstName" required autocomplete="given-name" placeholder="Bijvoorbeeld: Anke">
            </div>
          ` : ""}
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="naam@voorbeeld.nl">
          </div>
          ${!isReset ? `
            <div class="field">
              <label for="password">Wachtwoord</label>
              <input type="password" id="password" name="password" required minlength="8" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="Minstens 8 tekens">
              ${isSignup ? '<p class="hint">Kies een wachtwoord van minimaal 8 tekens.</p>' : ""}
            </div>
          ` : ""}

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="auth-submit">
            ${isReset ? "Stuur herstellink" : isSignup ? "Maak account aan" : "Log in"}
          </button>

          ${!isReset && !isSignup ? `
            <div class="text-center">
              <button type="button" class="btn-link" data-mode="reset">Wachtwoord vergeten?</button>
            </div>
          ` : ""}
        </form>

        <div class="auth-switch">
          ${isReset ? `
            Geen account? Of toch inloggen?
            <button type="button" data-mode="signin">Terug naar inloggen</button>
          ` : isSignup ? `
            Heb je al een kookboek?
            <button type="button" data-mode="signin">Log hier in</button>
          ` : `
            Nog geen kookboek?
            <button type="button" data-mode="signup">Maak er een aan</button>
          `}
        </div>
      </div>
    </div>
  `;

  // Mode switch links
  containerEl.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      render();
    });
  });

  // Form submit
  containerEl.querySelector("#auth-form").addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const submit = containerEl.querySelector("#auth-submit");
  const origLabel = submit.textContent;
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> Bezig...';

  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password?.value || "";
  const firstName = form.firstName?.value.trim() || "";

  try {
    if (mode === "signup") {
      if (!firstName) throw new Error("Vul je voornaam in.");
      await supabaseClient.signUp({ email, password, firstName });
      toast("Account aangemaakt. Check je mail om te bevestigen.", "success");
    } else if (mode === "signin") {
      await supabaseClient.signIn({ email, password });
      // onAuthChange listener in main.js handelt de redirect af
    } else if (mode === "reset") {
      await supabaseClient.sendPasswordReset(email);
      toast("Herstellink verstuurd, check je mail.", "success");
      mode = "signin";
      render();
    }
  } catch (err) {
    const msg = parseAuthError(err);
    toast(msg, "error");
  } finally {
    submit.disabled = false;
    submit.textContent = origLabel;
  }
}

function parseAuthError(err) {
  const msg = err?.message || String(err);
  // Vertaal veelvoorkomende Supabase foutmeldingen
  if (msg.includes("Invalid login credentials")) return "Email of wachtwoord klopt niet.";
  if (msg.includes("Email not confirmed")) return "Bevestig je email eerst via de mail die je hebt gehad.";
  if (msg.includes("User already registered")) return "Er bestaat al een account met dit emailadres.";
  if (msg.includes("Password should be at least")) return "Wachtwoord moet minimaal 8 tekens zijn.";
  return msg;
}
