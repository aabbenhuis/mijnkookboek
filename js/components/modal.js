// Confirmation modal

let backdrop = null;
let titleEl = null;
let bodyEl = null;
let okBtn = null;
let cancelBtn = null;

function ensureModal() {
  if (backdrop) return;
  backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <h2></h2>
      <p></p>
      <div class="modal-actions">
        <button class="btn btn-secondary modal-cancel">Annuleer</button>
        <button class="btn btn-primary modal-confirm">Ja, doe maar</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  titleEl = backdrop.querySelector("h2");
  bodyEl = backdrop.querySelector("p");
  okBtn = backdrop.querySelector(".modal-confirm");
  cancelBtn = backdrop.querySelector(".modal-cancel");
}

export function confirmModal(title, body, opts = {}) {
  ensureModal();
  return new Promise((resolve) => {
    titleEl.textContent = title;
    bodyEl.textContent = body;
    okBtn.textContent = opts.okLabel || "Ja, doe maar";
    cancelBtn.textContent = opts.cancelLabel || "Annuleer";
    backdrop.classList.add("open");
    const cleanup = (val) => {
      backdrop.classList.remove("open");
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(val);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}
