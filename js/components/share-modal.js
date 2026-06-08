// Share modal: toont een gegenereerde share URL met copy knop en sociale share opties

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "./toast.js";

let backdrop = null;

function ensureModal() {
  if (backdrop) return;
  backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal share-modal">
      <h2 id="share-title">Deel link</h2>
      <p id="share-body" style="margin-bottom: 16px;"></p>
      <div class="share-url-row">
        <input type="text" id="share-url" readonly />
        <button class="btn btn-primary" id="share-copy">Kopieer</button>
      </div>
      <div class="share-actions" id="share-social"></div>
      <div class="modal-actions" style="margin-top: 24px;">
        <button class="btn btn-secondary modal-cancel">Sluiten</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector(".modal-cancel").addEventListener("click", () => backdrop.classList.remove("open"));
}

export async function showShareModal({ scope, targetId, title }) {
  ensureModal();
  const titleEl = backdrop.querySelector("#share-title");
  const bodyEl = backdrop.querySelector("#share-body");
  const urlEl = backdrop.querySelector("#share-url");
  const copyBtn = backdrop.querySelector("#share-copy");
  const socialEl = backdrop.querySelector("#share-social");

  if (scope === "recipe") {
    titleEl.textContent = "Deel dit recept";
    bodyEl.textContent = `"${title}" delen met je vrienden of familie. Iedereen met de link kan het recept lezen, geen account nodig.`;
  } else {
    titleEl.textContent = "Deel je kookboek";
    bodyEl.textContent = "Iedereen met deze link kan al je recepten lezen, geen account nodig. Je kunt de link uitschakelen door hem te verwijderen in instellingen.";
  }

  urlEl.value = "Even genereren...";
  socialEl.innerHTML = "";
  backdrop.classList.add("open");

  try {
    const result = await supabaseClient.createShareLink({ scope, targetId });
    console.log("[share] create response:", result);
    const slug = result?.slug;
    if (!slug) {
      throw new Error("Geen slug terug van server. Check Supabase logs.");
    }
    const url = `${window.location.origin}${window.location.pathname}?share=${slug}`;
    urlEl.value = url;

    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Gekopieerd";
        setTimeout(() => copyBtn.textContent = "Kopieer", 2000);
      } catch {
        urlEl.select();
        document.execCommand("copy");
        copyBtn.textContent = "Gekopieerd";
        setTimeout(() => copyBtn.textContent = "Kopieer", 2000);
      }
    };

    const shareText = scope === "recipe" ? `Ik deel mijn recept: ${title}` : "Bekijk mijn kookboek";
    socialEl.innerHTML = `
      <a class="btn btn-secondary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}">WhatsApp</a>
      <a class="btn btn-secondary" target="_blank" rel="noopener" href="mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + "\n\n" + url)}">Mail</a>
    `;
  } catch (err) {
    urlEl.value = "";
    toast(err.message || "Link maken mislukt", "error");
  }
}

export function closeShareModal() {
  if (backdrop) backdrop.classList.remove("open");
}
