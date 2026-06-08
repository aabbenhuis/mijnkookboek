// Voorbeeldrecepten die nieuwe gebruikers cadeau krijgen bij registratie
// Geselecteerd door Anke uit haar Bowls boek en chef-s-creaties
//
// Elk recept heeft een slug. De foto wordt eenmalig gegenereerd via de admin tool
// in Instellingen en opgeslagen in de seed-photos bucket onder die slug.
// Bij elke nieuwe gebruiker wordt de URL automatisch ingevuld.

import { SUPABASE_URL } from "../config.js";

export const SEED_PHOTO_BASE = `${SUPABASE_URL}/storage/v1/object/public/seed-photos`;

export function seedPhotoUrl(slug) {
  return `${SEED_PHOTO_BASE}/${slug}.jpg`;
}

export const EXAMPLE_RECIPES = [
  {
    slug: "pokebowl-zalm-mango",
    title: "PokéBowl met zalm en mango",
    description: "Een frisse Hawaiiaanse bowl met rauwe zalm, romige avocado en zoete mango. Perfect voor een warme zomeravond of als snelle lunch.",
    cook_time: 20,
    servings: 2,
    category: "Bowl",
    meal_type: "Lunch",
    dish_type: ["Bowl"],
    diet: [],
    tags: ["snel", "fris", "hawaiiaans"],
    ingredients: [
      "200 g sushikwaliteit zalm, in blokjes",
      "200 g sushirijst",
      "250 ml water",
      "2 el rijstazijn",
      "1 tl suiker",
      "1 tl zout",
      "1 rijpe mango, in blokjes",
      "1 avocado, in plakjes",
      "1 kleine komkommer, in dunne plakjes",
      "100 g edamame bonen",
      "2 lente uitjes, in ringetjes",
      "1 el sesamzaadjes",
      "2 el sojasaus",
      "1 tl sesamolie",
      "1 tl honing",
      "1 tl sriracha, optioneel"
    ],
    instructions: [
      "Spoel de sushirijst tot het water helder is. Kook met 250 ml water op laag vuur in 12 minuten.",
      "Meng rijstazijn, suiker en zout. Roer dit door de warme rijst en laat afkoelen.",
      "Maak de marinade: meng sojasaus, sesamolie, honing en eventueel sriracha.",
      "Schep de zalmblokjes door de helft van de marinade en laat 5 minuten staan.",
      "Verdeel de rijst over twee kommen.",
      "Schik de zalm, mango, avocado, komkommer en edamame rondom de rijst.",
      "Besprenkel met de rest van de marinade. Bestrooi met lente ui en sesamzaadjes."
    ],
    tips: "Geen sushikwaliteit zalm? Gebruik gerookte zalm of gegrilde kipreepjes. Voor extra crunch een handje gefrituurde uitjes erbij.",
    cook_style: "neutraal",
    source: "example",
    language: "nl",
    is_example: true,
    nutrition: { calories: 520, protein: 28, carbs: 65, fat: 16, fiber: 7 }
  },
  {
    slug: "kip-noedelsoep-kokos",
    title: "Pittige Kip Noedelsoep met Kokos",
    description: "Verwarmende smaken in elke slok, met een pittige kick. Een snelle Aziatische soep voor doordeweekse avonden.",
    cook_time: 25,
    servings: 2,
    category: "Soep",
    meal_type: "Avondeten",
    dish_type: ["Soep"],
    diet: [],
    tags: ["aziatisch", "snel", "pittig"],
    ingredients: [
      "200 g kipfilet, in blokjes",
      "1 el gember, fijngehakt",
      "100 g spitskool, fijn gesneden",
      "100 g broccoli, in kleine roosjes",
      "een halve courgette, in dunne plakjes",
      "1 kleine rode peper, in ringetjes",
      "400 ml kokosmelk",
      "150 g noedels",
      "1 ui, gesnipperd",
      "1 el olijfolie",
      "Zout en peper naar smaak"
    ],
    instructions: [
      "Verhit de olijfolie in een grote pan op middelhoog vuur.",
      "Voeg de gesnipperde ui en gember toe en fruit 2 minuten tot ze zacht zijn.",
      "Voeg de kipblokjes toe en bak goudbruin in ongeveer 5 minuten.",
      "Voeg spitskool, broccoli, courgette en rode peper toe en bak 3 minuten mee.",
      "Giet de kokosmelk erbij en breng aan de kook. Laat 5 minuten zachtjes koken.",
      "Kook ondertussen de noedels volgens de verpakking. Giet af en voeg toe aan de soep.",
      "Roer goed door en laat nog 1 minuut koken. Breng op smaak met zout en peper."
    ],
    tips: "Voor een extra kick meer rode peper of een schepje sambal. Maak het af met verse koriander of munt voor een frisse afdronk.",
    cook_style: "neutraal",
    source: "example",
    language: "nl",
    is_example: true,
    nutrition: { calories: 580, protein: 32, carbs: 48, fat: 28, fiber: 6 }
  },
  {
    slug: "pulled-pork-quinoa-bowl",
    title: "Pulled Pork Quinoa Bowl",
    description: "Een voedzame en kleurrijke combinatie vol smaak en textuur. Eiwitrijk, fris en bevredigend.",
    cook_time: 30,
    servings: 2,
    category: "Bowl",
    meal_type: "Lunch",
    dish_type: ["Bowl"],
    diet: ["eiwitrijk"],
    tags: ["amerikaans", "fris"],
    ingredients: [
      "200 g pulled pork",
      "150 g quinoa",
      "1 rode paprika, in blokjes",
      "1 komkommer, in blokjes",
      "2 el olijfolie",
      "1 citroen, sap en rasp",
      "Zout naar smaak",
      "Peper naar smaak"
    ],
    instructions: [
      "Kook de quinoa volgens de verpakking in gezouten water, ongeveer 15 minuten.",
      "Laat de quinoa even afkoelen en meng met de blokjes paprika en komkommer.",
      "Verhit de pulled pork in een pan op middelhoog vuur tot warm, ongeveer 5 minuten.",
      "Maak de dressing: meng olijfolie, citroensap en citroenrasp. Breng op smaak met zout en peper.",
      "Verdeel het quinoa mengsel over twee borden en leg de warme pulled pork erop.",
      "Druppel de citrusdressing over het geheel en serveer direct."
    ],
    tips: "Voeg avocado toe voor romigheid of feta voor extra smaak. Een handje verse koriander maakt het af.",
    cook_style: "neutraal",
    source: "example",
    language: "nl",
    is_example: true,
    nutrition: { calories: 580, protein: 34, carbs: 52, fat: 22, fiber: 6 }
  },
  {
    slug: "bloemkool-tahin",
    title: "Kruidige Geroosterde Bloemkool met Tahin",
    description: "Een smaakvolle combinatie van geroosterde bloemkool en romige tahinsaus. Vegan, gezond en vol smaak.",
    cook_time: 30,
    servings: 2,
    category: "Bijgerecht",
    meal_type: "Bijgerecht",
    dish_type: [],
    diet: ["vegan", "vegetarisch", "glutenvrij"],
    tags: ["midden-oosters", "groente"],
    ingredients: [
      "1 kleine bloemkool van ongeveer 500 g, in roosjes",
      "2 el olijfolie",
      "2 teentjes knoflook, fijngehakt",
      "1 tl gemalen komijn",
      "1 tl paprikapoeder",
      "Zout naar smaak",
      "Peper naar smaak",
      "2 el tahin",
      "1 el citroensap",
      "Water, indien nodig voor de saus",
      "Verse peterselie ter garnering, optioneel"
    ],
    instructions: [
      "Verwarm de oven voor op 200 graden, of 180 hetelucht.",
      "Meng in een kom olijfolie, knoflook, komijn, paprikapoeder, zout en peper tot een marinade.",
      "Voeg de bloemkoolroosjes toe aan de marinade en zorg dat ze goed bedekt zijn.",
      "Leg de gemarineerde bloemkool op een bakplaat en rooster 20 minuten tot goudbruin en zacht.",
      "Maak ondertussen de tahinsaus: meng tahin met citroensap en een snufje zout.",
      "Voeg geleidelijk water toe tot de gewenste romigheid is bereikt.",
      "Serveer de geroosterde bloemkool warm, besprenkeld met de tahinsaus en garneer met peterselie."
    ],
    tips: "Voor extra textuur geroosterde noten of zaden als topping. Heerlijk als bijgerecht bij gegrild vlees of vis.",
    cook_style: "ottolenghi",
    source: "example",
    language: "nl",
    is_example: true,
    nutrition: { calories: 320, protein: 11, carbs: 22, fat: 22, fiber: 8 }
  },
  {
    slug: "zuurkoolschotel",
    title: "Zuurkoolschotel de Luxe met krokante spekjes en appel",
    description: "Comfortfood in optima forma. Een hartverwarmende ovenschotel vol smaak, textuur en Hollandse traditie. Voor wanneer het buiten kouder wordt.",
    cook_time: 60,
    servings: 4,
    category: "Avondeten",
    meal_type: "Avondeten",
    dish_type: ["Ovenschotel"],
    diet: [],
    tags: ["nederlands", "comfort", "familie", "winter"],
    ingredients: [
      "750 g kruimige aardappelen, geschild en in stukken",
      "500 g zuurkool, uitgelekt en lichtjes uitgedrukt",
      "200 g gerookt spek in blokjes of reepjes",
      "2 middelgrote appels zoals Elstar of Jonagold, in blokjes",
      "1 grote ui, fijngesnipperd",
      "2 el roomboter",
      "200 ml melk, warm",
      "50 g Parmezaanse kaas, vers geraspt",
      "1 tl kerriepoeder",
      "1 snufje nootmuskaat, vers geraspt",
      "Zwarte peper, versgemalen",
      "Zeezout naar smaak",
      "2 el milde olijfolie"
    ],
    instructions: [
      "Kook de geschilde aardappelen in ruim gezouten water in 15 tot 20 minuten gaar. Giet af en laat uitstomen.",
      "Verwarm de oven voor op 200 graden boven en onderwarmte.",
      "Verhit olijfolie in een grote koekenpan op middelhoog vuur. Bak de spekjes in 8 tot 10 minuten goudbruin en krokant. Haal eruit en laat uitlekken op keukenpapier. Bewaar een eetlepel bakvet.",
      "Voeg de ui toe aan het bakvet en fruit 3 tot 4 minuten glazig. Voeg appelblokjes en kerriepoeder toe en bak nog 5 minuten tot de appel zacht wordt.",
      "Schep de zuurkool erdoor en warm 2 minuten zachtjes door.",
      "Stamp de aardappelen fijn met de roomboter, warme melk en nootmuskaat. Breng op smaak met peper en zout. Zorg voor een smeuige puree.",
      "Vet een ovenschaal van ongeveer 25 bij 30 cm in. Verdeel de helft van de aardappelpuree over de bodem.",
      "Schep het zuurkool appel mengsel erop. Strooi de helft van de krokante spekjes erover.",
      "Dek af met de rest van de aardappelpuree en strijk glad. Bestrooi met Parmezaanse kaas en de rest van de spekjes.",
      "Bak in 20 tot 25 minuten goudbruin en door en door warm. Laat 5 minuten rusten voor het serveren."
    ],
    tips: "Serveer met een frisse groene salade. Voor vegetarisch: vervang spekjes door gerookte tofu of champignons in sojasaus. Een theelepel dijonmosterd door de puree geeft een pittige toets.",
    cook_style: "neutraal",
    source: "example",
    language: "nl",
    is_example: true,
    nutrition: { calories: 620, protein: 22, carbs: 58, fat: 32, fiber: 7 }
  },
];
