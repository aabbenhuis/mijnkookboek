// Eenvoudige view router voor de v2 app
// Wisselt tussen verschillende views in de app container

import { STATE, setState } from "./state.js";

const VIEW_MODULES = {};
let mountFn = null;

export function registerView(name, module) {
  VIEW_MODULES[name] = module;
}

export function setMountTarget(fn) {
  mountFn = fn;
}

export async function showView(name, params = {}) {
  const module = VIEW_MODULES[name];
  if (!module) {
    console.error("Onbekende view:", name);
    return;
  }
  setState({ currentView: name, viewParams: params });
  const container = mountFn ? mountFn() : null;
  if (container && module.mount) {
    await module.mount(container, params);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}
