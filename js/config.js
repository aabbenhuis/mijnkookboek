// Mijn Digitaal Kookboek, configuratie
// Deze waarden zijn veilig om in de browser te staan
// Geheime keys (secret, service_role, OpenAI, Anthropic) staan in Supabase edge functions

export const APP_NAME_INTERFACE = "Mijn Kookboek";
export const APP_NAME_OFFICIAL = "Mijn Digitaal Kookboek";
export const APP_TAGLINE = "Jouw recepten, altijd binnen handbereik";

export const SUPABASE_URL = "https://ffagkcalsutzlofxbmax.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ncOxKMmCfsoBqc_dz_78EQ_KoBFrF42";

// Credit kosten per actie
export const CREDIT_COSTS = {
  GENERATE: 1,        // recept genereren via formulier of chat
  VISION: 1,          // foto inlezen (handgeschreven recept)
  AI_PHOTO: 5,        // AI gegenereerde recept foto
  NUTRITION: 1,       // voedingswaarden berekenen
  PAIRING: 1,         // bier of wijntip via AI
};

// Credit pakketten verkocht via Mollie
export const CREDIT_PACKAGES = [
  { id: "proef",    label: "Proef",     credits: 50,  priceEur: 4.95 },
  { id: "populair", label: "Populair",  credits: 150, priceEur: 12.95 },
  { id: "power",    label: "Power",     credits: 500, priceEur: 29.95 },
];

// Gratis credits bij eerste registratie
export const FREE_CREDITS_ON_SIGNUP = 10;

// AI configuratie
export const CLAUDE_MODEL = "claude-opus-4-5";
export const OPENAI_IMAGE_MODEL = "gpt-image-1";
export const OPENAI_IMAGE_QUALITY = "medium";

// Foto compressie regels
export const PHOTO_MAX_DIM = 1600;
export const PHOTO_QUALITY = 0.85;
export const PHOTO_MAX_UPLOAD_MB = 10;
