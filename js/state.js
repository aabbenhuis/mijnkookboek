// Eenvoudige reactive state store
// Andere modules importeren STATE en luisteren naar veranderingen via subscribe

const listeners = new Set();

export const STATE = {
  user: null,           // Supabase auth user
  profile: null,        // public.profiles record
  currentView: "auth",  // huidige actieve view
  loading: false,       // globale loading state
};

export function setState(updates) {
  Object.assign(STATE, updates);
  listeners.forEach(fn => fn(STATE));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
