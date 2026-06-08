// Entry point voor Mijn Digitaal Kookboek v2
// Beheert auth state en wissel tussen auth view en app shell met view router

import * as supabaseClient from "./storage/supabase-client.js";
import { STATE, setState } from "./state.js";
import { toast } from "./components/toast.js";
import { mountShell, getContent, updateActiveNav } from "./components/app-shell.js";
import { registerView, setMountTarget, showView } from "./router.js";
import * as authView from "./views/auth.js";
import * as onboardingView from "./views/onboarding.js";
import * as homeView from "./views/home.js";
import * as addView from "./views/add.js";
import * as detailView from "./views/detail.js";
import * as shoppingView from "./views/shopping.js";
import * as settingsView from "./views/settings.js";
import * as shareView from "./views/share.js";
import * as creditsView from "./views/credits.js";

const appRoot = document.getElementById("app");

// Register all main views
registerView("home", homeView);
registerView("add", addView);
registerView("detail", detailView);
registerView("shopping", shoppingView);
registerView("settings", settingsView);
registerView("credits", creditsView);

setMountTarget(() => getContent());

async function loadProfile() {
  let attempts = 0;
  while (attempts < 5) {
    try {
      const profile = await supabaseClient.getProfile();
      if (profile) {
        setState({ profile });
        return profile;
      }
    } catch (err) {
      console.warn("Profile load attempt failed:", err);
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return null;
}

async function showAppShell() {
  // Mount the app shell (top nav, bottom nav, content container)
  mountShell(appRoot);
  // Start at home
  await showView("home");
}

async function handleAuthState(event, session) {
  if (session?.user) {
    setState({ user: session.user });
    const profile = await loadProfile();
    // Nieuwe gebruiker zonder voornaam ingevuld of zonder onboarding? Stuur naar onboarding
    if (profile && !profile.onboarded_at) {
      onboardingView.mount(appRoot);
    } else {
      await showAppShell();
    }
  } else {
    setState({ user: null, profile: null, currentView: "auth" });
    authView.mount(appRoot);
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const shareSlug = params.get("share");
  if (shareSlug) {
    await shareView.mount(appRoot, { slug: shareSlug });
    return;
  }

  supabaseClient.onAuthChange((event, session) => {
    handleAuthState(event, session);
  });
  const session = await supabaseClient.getSession();
  await handleAuthState(null, session);

  // Als gebruiker terugkomt na Mollie betaling: refresh profiel en toon melding
  if (params.get("payment") === "done") {
    setTimeout(async () => {
      try {
        const profile = await supabaseClient.getProfile();
        if (profile) {
          setState({ profile });
          const { updateCreditDisplay } = await import("./components/app-shell.js");
          updateCreditDisplay();
        }
        toast("Betaling verwerkt. Je credits zijn bijgewerkt.", "success");
        // Verwijder query params uit URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }, 1000);
  }
}

init().catch(err => {
  console.error("Init mislukt:", err);
  toast("Er ging iets mis bij het laden, vernieuw de pagina.", "error");
});
