// Maaltijdtype, gerechttype en dieet opties
// Vervangen de oude `category` veld dat twee dimensies door elkaar haalde

// Maaltijdtype: wanneer eet je het, één keuze
export const MEAL_TYPES = [
  "Ontbijt",
  "Brunch",
  "Tussendoortje",
  "Lunch",
  "Avondeten",
  "Bijgerecht",
  "Toetje",
  "Drankje",
  "Borrelhap",
  "Bakken",
];

// Gerechttype: wat is het, één of meer keuzes optioneel
export const DISH_TYPES = [
  "Bowl",
  "Soep",
  "Salade",
  "Pasta",
  "Rijstgerecht",
  "Pizza",
  "Wrap of tortilla",
  "Sandwich of brood",
  "Burger",
  "Risotto",
  "Curry",
  "Stoof of stamppot",
  "Ovenschotel",
  "Quiche of hartige taart",
  "Pannenkoek of poffer",
  "Cake of taart",
  "Koekjes",
  "Smoothie of sap",
  "Saus of dip",
  "Marinade of rub",
];

// Dieet: voor wie is het, één of meer keuzes optioneel
export const DIETS = [
  { key: "vegetarisch", label: "Vegetarisch", icon: "🥬", color: "mint" },
  { key: "vegan", label: "Vegan", icon: "🌱", color: "mint" },
  { key: "glutenvrij", label: "Glutenvrij", icon: "🌾", color: "peach" },
  { key: "lactosevrij", label: "Lactosevrij", icon: "🥛", color: "sky" },
  { key: "notenvrij", label: "Notenvrij", icon: "🥜", color: "peach" },
  { key: "koolhydraatarm", label: "Koolhydraatarm", icon: "🍞", color: "lavender" },
  { key: "eiwitrijk", label: "Eiwitrijk", icon: "💪", color: "rose" },
  { key: "suikervrij", label: "Suikervrij", icon: "🍬", color: "peach" },
  { key: "halal", label: "Halal vriendelijk", icon: "🌙", color: "sky" },
];

export function getDiet(key) {
  return DIETS.find(d => d.key === key) || null;
}

// Mapping van oude category waarde naar nieuwe meal_type + dish_type
// Wordt gebruikt voor migratie van bestaande recepten
export const LEGACY_CATEGORY_MAP = {
  "Ontbijt": { mealType: "Ontbijt", dishTypes: [] },
  "Lunch": { mealType: "Lunch", dishTypes: [] },
  "Avondeten": { mealType: "Avondeten", dishTypes: [] },
  "Bijgerecht": { mealType: "Bijgerecht", dishTypes: [] },
  "Toetje": { mealType: "Toetje", dishTypes: [] },
  "Drankje": { mealType: "Drankje", dishTypes: [] },
  "Bowl": { mealType: "Lunch", dishTypes: ["Bowl"] },
  "Soep": { mealType: "Avondeten", dishTypes: ["Soep"] },
  "Salade": { mealType: "Lunch", dishTypes: ["Salade"] },
  "Pasta": { mealType: "Avondeten", dishTypes: ["Pasta"] },
  "Anders": { mealType: null, dishTypes: [] },
};
