// Toast notificaties

let stackEl = null;

function getStack() {
  if (!stackEl) {
    stackEl = document.createElement("div");
    stackEl.className = "toast-stack";
    document.body.appendChild(stackEl);
  }
  return stackEl;
}

export function toast(msg, kind = "", action = null) {
  const el = document.createElement("div");
  el.className = "toast " + kind;
  if (action) {
    const textSpan = document.createElement("span");
    textSpan.className = "toast-text";
    textSpan.textContent = msg;
    el.appendChild(textSpan);
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      try { action.onClick(); } catch (e) {}
      el.remove();
    });
    el.appendChild(btn);
  } else {
    el.textContent = msg;
  }
  getStack().appendChild(el);
  // Foutmeldingen blijven langer zichtbaar, gebruiker moet ze kunnen lezen
  const duration = action ? 6000 : (kind === "error" ? 7000 : 4000);
  setTimeout(() => el.remove(), duration);
  return el;
}
