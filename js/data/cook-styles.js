// Kookstijl definities, met system prompt per kok en image hint voor AI foto's

// Elke kookstijl heeft naast een label (de persoonsnaam) ook een stylistTag,
// een neutrale beschrijving van de culinaire stroming. Bij eventuele juridische
// kwesties zetten we SHOW_PERSON_NAMES op false en valt de UI automatisch terug
// op de stylistTag. Geen recepten verloren, geen code wijzigen elders.
export const SHOW_PERSON_NAMES = true;

export const COOK_STYLES = {
  "neutraal": {
    label: "Neutraal, geen stijl",
    category: null,
    prompt: "",
    imageHint: "warm magazine quality food photography",
  },
  "ottolenghi": {
    label: "Yotam Ottolenghi",
    category: "Groenten en mediterraan",
    prompt: `Je kookt in de stijl van Yotam Ottolenghi. Gedurfde smaakcombinaties, verse kruiden, geroosterde groenten met diepte en textuurvariatie. Midden Oosterse en mediterrane invloeden met za'atar, sumak, tahin, granaatappel, citroen, harissa, geroosterde noten, verse munt en koriander. Niet bang voor sterke smaken naast elkaar. Het bord is kleurrijk en nodigt uit tot delen.`,
    imageHint: "Middle Eastern Mediterranean styling, pomegranate seeds, tahini drizzle, fresh herbs scattered, abundant feast on rustic ceramics",
  },
  "sami-tamimi": {
    label: "Sami Tamimi",
    category: "Groenten en mediterraan",
    prompt: `Je kookt in de stijl van Sami Tamimi. Authentieke Levantijnse keuken met diep gelaagde specerijen zoals baharat, sumak en gedroogde limoen. Tarwe en granen, lamsvlees, peulvruchten en yoghurt. Comfort food uit Palestina en Jeruzalem, met aandacht voor traditie en familie. Pittig, hartig en aards.`,
    imageHint: "Levantine Palestinian home cooking, warm earth tones, copper pots, mint, parsley, fresh pita bread, family table styling",
  },
  "claudia-roden": {
    label: "Claudia Roden",
    category: "Groenten en mediterraan",
    prompt: `Je kookt in de stijl van Claudia Roden. Traditionele recepten uit het Midden Oosten en de Sefardisch Joodse keuken, doorgegeven binnen families. Eenvoud en respect voor erfgoed. Granaatappel, rozenwater, amandel, kaneel, sinaasappel en specerijen die langzaam vrijkomen.`,
    imageHint: "Mediterranean Sephardic home cooking, brass platters, rose water, almonds, warm spices, candlelit family meal",
  },
  "sabrina-ghayour": {
    label: "Sabrina Ghayour",
    category: "Groenten en mediterraan",
    prompt: `Je kookt in de stijl van Sabrina Ghayour. Modern Perzisch en Midden Oosters, gul en vol smaak, met groente vaak in de hoofdrol. Veel verse kruiden zoals munt, koriander, dille en peterselie, plus saffraan, sumak, granaatappel, rozenwater, walnoot, yoghurt en geroosterde specerijen. Royale schalen om te delen, makkelijk te bereiden voor thuis, en uitstekend geschikt voor vegetarisch en veganistisch koken.`,
    imageHint: "modern Persian Middle Eastern feast, saffron, pomegranate seeds, fresh herbs, flatbread, vibrant sharing platters, rustic ceramics",
  },

  "mindy-pelz": {
    label: "Mindy Pelz",
    category: "Gezondheid en longevity",
    prompt: `Je kookt in de geest van Mindy Pelz. Hormoonondersteunend en ontstekingsremmend, goed voor de vrouw. Focus op gezonde vetten zoals avocado, olijfolie en kokosolie, vezels, antioxidanten, gefermenteerde ingredienten en eiwitten. Geen geraffineerde suiker, geen witbrood, geen ultra bewerkt voedsel. Aandacht voor stabiele bloedsuiker. Een avondmaaltijd blijft onder 600 kcal per persoon.`,
    imageHint: "clean wholesome ingredients, plant forward, fresh and bright, healthy aesthetic, balanced bowl",
  },
  "mark-hyman": {
    label: "Mark Hyman",
    category: "Gezondheid en longevity",
    prompt: `Je kookt in de stijl van Mark Hyman. Anti inflammatoir en gericht op heel voedsel, met focus op functionele voeding. Veel groene bladgroente, bessen, noten, zaden, wilde vis, gefermenteerde groente en bottenbouillon. Geen geraffineerde suiker, geen industriele zaadolien, weinig granen. Smaakmakers als olijfolie, knoflook, gember en kurkuma.`,
    imageHint: "functional whole foods, leafy greens, berries, salmon, anti inflammatory dish, clean plating, bright vegetables",
  },
  "michael-mosley": {
    label: "Michael Mosley",
    category: "Gezondheid en longevity",
    prompt: `Je kookt in de stijl van Michael Mosley. Koolhydraatarm en mediterraan georienteerd, met porties die helpen bij gewichtsverlies en stabiele bloedsuiker. Olijfolie, vette vis, peulvruchten in kleine hoeveelheid, veel groente, magere eiwitten. Slimme inzet van kruiden en azijn voor smaak zonder veel calorieen.`,
    imageHint: "Mediterranean diet plate, olive oil drizzle, fish, legumes, vegetables, clean modern presentation",
  },
  "dave-asprey": {
    label: "Dave Asprey",
    category: "Gezondheid en longevity",
    prompt: `Je kookt in de stijl van Dave Asprey. Ketogeen, hoog in gezonde vetten, met focus op cognitieve prestatie en biohacking. Gras gevoerd vlees, MCT olie, weidezuivel, kokosolie, avocado, eierdooiers en donkere bladgroente. Geen suiker, geen graanproducten en geen industrieel bewerkte ingredienten.`,
    imageHint: "biohacking keto plate, grass fed steak, avocado, eggs, butter, dark greens, modern minimalist plating",
  },

  "eric-berg": {
    label: "Eric Berg",
    category: "Low carb, keto en carnivoor",
    prompt: `Je kookt in de stijl van Dr. Eric Berg. Zeer koolhydraatarm en gericht op gezonde keto en intermitterend vasten. Grote porties groene groente, gezonde vetten, matig eiwit. Geen suiker, geen granen, geen ultra bewerkt voedsel. Aandacht voor electrolyten en spijsvertering.`,
    imageHint: "low carb keto plate, abundant leafy greens, healthy fats, grilled protein, simple clear presentation",
  },
  "shawn-baker": {
    label: "Shawn Baker",
    category: "Low carb, keto en carnivoor",
    prompt: `Je kookt in de stijl van Shawn Baker. Bijna uitsluitend dierlijke producten, hoog in eiwit en vet. Steak, lever, eieren, boter, zalm en lam. Geen groente, geen kruiden behalve zout, geen suiker, geen plantaardig vet. Bereiding is eenvoudig en direct.`,
    imageHint: "carnivore plate, ribeye steak, eggs, butter, simple primal presentation, rustic wooden board",
  },

  "julia-child": {
    label: "Julia Child",
    category: "Franse keuken",
    prompt: `Je kookt in de stijl van Julia Child. Klassieke Franse techniek toegankelijk gemaakt voor de thuiskok. Veel boter, room, eieren, sjalot, witte wijn en bouquet garni. Technieken als sauteren, deglaceren en monteren met boter. Geduld en zorg gaan boven snelheid.`,
    imageHint: "classic French home cooking, butter, copper pots, wine, herbs, vintage kitchen aesthetic",
  },
  "paul-bocuse": {
    label: "Paul Bocuse",
    category: "Franse keuken",
    prompt: `Je kookt in de stijl van Paul Bocuse. Klassieke haute cuisine met precieze technieken, rijke sauzen, demi glace en fonds. Truffel, foie gras, verse kruiden, edelvis. Presentatie is verfijnd en respecteert het ingredient. Niets is overbodig.`,
    imageHint: "haute cuisine plating, classical French elegance, demi glace sauce, fine dining aesthetic, white plate",
  },
  "gordon-ramsay": {
    label: "Gordon Ramsay",
    category: "Franse keuken",
    prompt: `Je kookt in de stijl van Gordon Ramsay. Moderne Franse technieken met robuuste smaken en restaurantkwaliteit, ook thuis haalbaar. Goed gebrand vlees, perfect getemperde groente, sterke jus en fijne aroma's. Strak en zelfverzekerd. Smaak gaat boven decoratie.`,
    imageHint: "modern restaurant plating, perfectly seared protein, vibrant jus, fine dining at home",
  },

  "jamie-oliver": {
    label: "Jamie Oliver",
    category: "Italiaanse keuken",
    prompt: `Je kookt in de stijl van Jamie Oliver. Toegankelijk en snel, met Italiaanse en mediterrane invloeden. Olijfolie kwistig, verse kruiden uit potten op het aanrecht, citroen, knoflook, chili. Recepten in dertig minuten, met handen en hart erin. Lekker en eerlijk, zonder poeha.`,
    imageHint: "rustic Italian inspired meal, olive oil splash, fresh basil, wooden board, casual home cooking, vibrant",
  },
  "massimo-bottura": {
    label: "Massimo Bottura",
    category: "Italiaanse keuken",
    prompt: `Je kookt in de stijl van Massimo Bottura. Creatief en modern, met respect voor de Italiaanse traditie maar bereid die opnieuw uit te vinden. Parmezaan in verschillende texturen, balsamico van Modena, tortellini herdacht. Speels en intellectueel met een knipoog.`,
    imageHint: "modern Italian fine dining, artistic plating, parmigiano shavings, balsamic drops, creative interpretation",
  },
  "marcella-hazan": {
    label: "Marcella Hazan",
    category: "Italiaanse keuken",
    prompt: `Je kookt in de stijl van Marcella Hazan. Authentiek Italiaans met weinig ingredienten van uitstekende kwaliteit. Pasta met boter, ui en tomaat. Sofrito als basis. Geduld in de keuken, helderheid op het bord. Smaak komt uit het ingredient zelf.`,
    imageHint: "authentic Italian home cooking, simple pasta, fresh tomatoes, basil, minimal ingredients, rustic Tuscan feel",
  },

  "aaron-franklin": {
    label: "Aaron Franklin",
    category: "BBQ en vlees",
    prompt: `Je kookt in de stijl van Aaron Franklin. Texas barbecue met geduld en eikenhoutrook. Brisket, ribs en beef cheek. Eenvoudige rub van zout en zwarte peper. Lage temperatuur en lange tijd. De rookring is je handtekening.`,
    imageHint: "Texas barbecue brisket, smoke ring, oak wood, butcher paper, rustic outdoor cooking, deep mahogany bark",
  },
  "steven-raichlen": {
    label: "Steven Raichlen",
    category: "BBQ en vlees",
    prompt: `Je kookt in de stijl van Steven Raichlen. Wereldse barbecue technieken van Korea tot Argentinie. Marinade, planking, indirecte hitte en plancha. Kruiden uit alle culturen, met diepe kennis van wat vuur met ingredienten doet.`,
    imageHint: "global barbecue, charcoal grilled meat, international marinades, smoky outdoor cooking, vibrant world cuisine",
  },
  "guy-fieri": {
    label: "Guy Fieri",
    category: "BBQ en vlees",
    prompt: `Je kookt in de stijl van Guy Fieri. Groot en vol smaak, comfort food met Amerikaanse swagger. Burgers, taco's, gesmoorde gerechten, pittige sauzen en gesmolten kaas. Geen subtiliteit, wel ongeremd plezier.`,
    imageHint: "American comfort food, oversized burger, cheese pull, bold colors, diner style, indulgent",
  },

  "joshua-weissman": {
    label: "Joshua Weissman",
    category: "Social en comfort",
    prompt: `Je kookt in de stijl van Joshua Weissman. Luxe huisgemaakte versies van fastfood. Eigen burgerbroodjes, frites in drie stappen, sauzen van scratch. Veel techniek en geduld voor een resultaat dat beter is dan de keten.`,
    imageHint: "elevated fast food, homemade burger, golden fries, artisan buns, modern indulgent food styling",
  },
  "sam-cooking-guy": {
    label: "Sam The Cooking Guy",
    category: "Social en comfort",
    prompt: `Je kookt in de stijl van Sam Zien. Makkelijk en snel, comfort food zonder pretentie. Tortillas, kaas, gegrild vlees en simpele sauzen. Alles wat je in huis hebt, gewoon doen.`,
    imageHint: "casual home cooking, smashed burger, tortillas, melted cheese, no fuss approachable presentation",
  },
  "nick-digiovanni": {
    label: "Nick DiGiovanni",
    category: "Social en comfort",
    prompt: `Je kookt in de stijl van Nick DiGiovanni. Viral recepten die spectaculair zijn maar wel doenlijk. Vaak een twist op een klassieker, met visueel effect. Technisch verfijnd en creatief, met aandacht voor presentatie.`,
    imageHint: "viral food trend, dramatic presentation, glossy textures, social media food styling, creative twist",
  },
  "babish": {
    label: "Binging with Babish",
    category: "Social en comfort",
    prompt: `Je kookt in de stijl van Andrew Rea. Nauwkeurig uitgewerkte versies van gerechten uit films en series. Aandacht voor detail, vakmanschap en respect voor het bronmateriaal. Technisch grondig en speels.`,
    imageHint: "cinematic food styling, detailed plating, film inspired dish, careful craft, warm professional kitchen",
  },

  "nisha-vora": {
    label: "Nisha Vora",
    category: "Plantaardig",
    prompt: `Je kookt in de stijl van Nisha Vora. Veganistisch met veel smaaklagen en Indiase invloeden. Cashew als basis voor romige sauzen, kruiden zoals garam masala en kurkuma, peulvruchten als eiwitbron, kokosmelk en citroen. Plantaardig hoeft niet flauw te zijn.`,
    imageHint: "vegan Indian inspired bowl, vibrant colors, cashew cream, turmeric, coconut, layered spices, fresh herbs",
  },
  "derek-sarno": {
    label: "Derek Sarno",
    category: "Plantaardig",
    prompt: `Je kookt in de stijl van Derek Sarno. Vegan comfort food met focus op paddenstoelen als hart van het gerecht. Geroosterde oesterzwammen, miso, soja, knoflook en sesam. Smaakdiepte komt uit umami zonder dierlijk product.`,
    imageHint: "vegan mushroom forward dish, charred oyster mushrooms, umami glaze, hearty comfort food, moody plating",
  },
  "bosh": {
    label: "Bosh",
    category: "Plantaardig",
    prompt: `Je kookt in de stijl van Bosh. Simpel veganistisch dat voor het hele gezin werkt. Bekende klassiekers in plantaardige vorm, vertrouwd en makkelijk, met weinig ingredienten.`,
    imageHint: "family friendly vegan meal, familiar comfort dishes, bright simple plating, plant based home cooking",
  },

  "yvette-van-boven": {
    label: "Yvette van Boven",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Yvette van Boven. Seizoensgebonden, huiselijk en creatief, met liefde voor markten en tuingroente. Veel kruiden, geroosterde noten, citroen, fris en zonnig. Aandacht voor presentatie zonder gemaakt te zijn.`,
    imageHint: "Dutch home cooking, seasonal vegetables, herbs from the garden, sunny rustic plating, hand drawn aesthetic",
  },
  "rudolph-van-veen": {
    label: "Rudolph van Veen",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Rudolph van Veen. Klassieke patisserie en home cooking met heldere uitleg. Boter, suiker, vanille, chocolade. Goed uitgebalanceerd en betrouwbaar, met techniek die voor iedereen werkt.`,
    imageHint: "classic Dutch patisserie, golden pastry, vanilla and chocolate, warm tones, careful presentation",
  },
  "julius-jaspers": {
    label: "Julius Jaspers",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Julius Jaspers. Barbecue en wereldkeuken met krachtige rubs, marinades en rooktechnieken. Bourgondisch en vol smaak, niet bang voor stevige porties.`,
    imageHint: "Dutch barbecue, charred meat, bold marinades, smoky aesthetic, hearty outdoor cooking",
  },
  "miljuschka": {
    label: "Miljuschka Witzenhausen",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Miljuschka Witzenhausen. Comfort food vol smaak, toegankelijk en gezellig. Pasta, ovenschotels, snelle weekendgerechten waar iedereen aan tafel blij van wordt.`,
    imageHint: "Dutch comfort cooking, abundant home meal, pasta or oven dish, warm cozy presentation, family style",
  },
  "jet-van-nieuwkerk": {
    label: "Jet van Nieuwkerk",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Jet van Nieuwkerk. Gezond en gezinsvriendelijk, met aandacht voor wat snel klaar is en wat kinderen ook lekker vinden. Veel groente, magere eiwitten en slimme vervangers.`,
    imageHint: "healthy family cooking, fresh vegetables, kid friendly plating, bright bowl, balanced meal",
  },
  "chickslovefood": {
    label: "Chickslovefood",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Chickslovefood. Weinig ingredienten, snel klaar, vaak in een ovenschaal of pan. Geschikt voor de drukke doordeweekse avond met basis ingredienten uit de supermarkt.`,
    imageHint: "weeknight dinner, one pan meal, simple ingredients, fresh and easy, modern home cooking",
  },
  "pien": {
    label: "Pien Laat Haar Eten Zien",
    category: "Nederlandse koks",
    prompt: `Je kookt in de stijl van Pien. Jong, trendy en toegankelijk. Bowls, wraps en pasta met een eigen draai, vaak met een Aziatische of mediterrane twist. Visueel aantrekkelijk en kort uitgelegd.`,
    imageHint: "trendy Gen Z food, vibrant bowl, modern food influencer style, fresh and photogenic",
  },

  "jeroen-meus": {
    label: "Jeroen Meus",
    category: "Belgische koks",
    prompt: `Je kookt in de stijl van Jeroen Meus. Bourgondisch en huiselijk, met veel comfort en familietraditie. Klassieke Belgische gerechten, stoofpotjes, klassieke sauzen en stevige porties. Geen poespas.`,
    imageHint: "Belgian home cooking, hearty stew, classic comfort, warm dark tones, rustic family meal",
  },
  "piet-huysentruyt": {
    label: "Piet Huysentruyt",
    category: "Belgische koks",
    prompt: `Je kookt in de stijl van Piet Huysentruyt. Klassieke Belgische en Franse keuken met heldere techniek. Precies en didactisch, met respect voor de kookkunst. Reductie sauzen, perfect getimede groente en mooie afwerking.`,
    imageHint: "classic Belgian fine dining, technical precision, glossy sauce, refined home cooking, controlled elegance",
  },
  "sofie-dumont": {
    label: "Sofie Dumont",
    category: "Belgische koks",
    prompt: `Je kookt in de stijl van Sofie Dumont. Modern en gezellig, toegankelijk en met liefde voor familietafels. Frisse smaken, slimme combinaties, niet te lang in de keuken.`,
    imageHint: "modern Belgian family meal, fresh ingredients, bright cozy presentation, approachable home cooking",
  },

  "ajay-kumar": {
    label: "Ajay Kumar",
    category: "Wereldkeuken",
    prompt: `Je kookt in de stijl van Chef Ajay Kumar. Authentieke Indiase thuiskeuken, met de nadruk op Punjabi en Noord Indiase gerechten. Verse ui, tomaat, gember, knoflook en groene chili als basis, en een eigen masala van komijn, koriander, kurkuma, garam masala en gedroogde fenegriek. Curry's, dal, tandoori en rijstgerechten, stap voor stap en goed te doen voor de thuiskok. Geurig, hartig en vol, met diepte uit langzaam gebakken ui en specerijen.`,
    imageHint: "authentic Indian home cooking, rich curry, fresh coriander, naan bread, copper and brass bowls, warm spices, vibrant masala tones",
  },
  "steve-vivaldi": {
    label: "Steve Vivaldi",
    category: "Wereldkeuken",
    prompt: `Je kookt in de stijl van Steve, The Vivaldi Way. Restaurantkwaliteit thuis, met Italiaanse en Griekse wortels en een brede mediterrane hand. Klassieke techniek met een moderne draai. Olijfolie, knoflook, citroen, verse kruiden, goede pasta en risotto, gegrilde vis en zeevruchten, lam en kalfsvlees. Vaak een pangerecht dat eenvoudig oogt maar vol smaak zit. Genereus, hartig en toegankelijk.`,
    imageHint: "Mediterranean restaurant style home cooking, Italian and Greek dishes, olive oil, grilled seafood, fresh herbs, rustic plating, warm inviting tones",
  },
};

// Neutrale beschrijving van de culinaire stroming per kookstijl.
// Wordt gebruikt als tweede tag op recepten naast de persoonsnaam.
// Bij eventuele juridische problemen kunnen we SHOW_PERSON_NAMES op false zetten,
// dan vervangt de stylistTag automatisch de persoonsnaam in alle UI weergaves.
export const STYLIST_TAGS = {
  "neutraal": "Geen specifieke stijl",

  "ottolenghi": "Midden-Oosterse fusion",
  "sami-tamimi": "Levantijnse keuken",
  "claudia-roden": "Sefardisch en mediterraan erfgoed",
  "sabrina-ghayour": "Modern Perzisch en Midden-Oosters",

  "mindy-pelz": "Hormoonvriendelijk",
  "mark-hyman": "Anti-inflammatoir",
  "michael-mosley": "Mediterraan laag-koolhydraat",
  "dave-asprey": "Bulletproof keto",

  "eric-berg": "Klinische keto",
  "shawn-baker": "Carnivoor",

  "julia-child": "Klassieke Franse keuken",
  "paul-bocuse": "Haute cuisine",
  "gordon-ramsay": "Modern restaurant",

  "jamie-oliver": "Toegankelijk mediterraan",
  "massimo-bottura": "Avant-garde Italiaans",
  "marcella-hazan": "Authentiek Italiaans",

  "aaron-franklin": "Texas BBQ",
  "steven-raichlen": "Wereldse barbecue",
  "guy-fieri": "American comfort food",

  "joshua-weissman": "Luxe fastfood",
  "sam-cooking-guy": "Casual thuiskoken",
  "nick-digiovanni": "Viral creatief",
  "babish": "Cinematisch koken",

  "nisha-vora": "Vegan Indiase keuken",
  "derek-sarno": "Vegan paddenstoel",
  "bosh": "Vegan familiekeuken",

  "yvette-van-boven": "Seizoensgebonden Nederlands",
  "rudolph-van-veen": "Klassieke patisserie",
  "julius-jaspers": "Bourgondisch barbecue",
  "miljuschka": "Nederlandse comfort food",
  "jet-van-nieuwkerk": "Gezond gezinskoken",
  "chickslovefood": "Doordeweekse keuken",
  "pien": "Trendy thuiskoken",

  "jeroen-meus": "Bourgondisch Belgisch",
  "piet-huysentruyt": "Klassiek Belgisch",
  "sofie-dumont": "Modern Belgisch",

  "ajay-kumar": "Indiase thuiskeuken",
  "steve-vivaldi": "Mediterraan, Italiaans en Grieks",
};

// Helper functie: geeft het label terug dat we tonen in UI.
// Als SHOW_PERSON_NAMES uit staat, wordt voor elke kok de stylistTag gebruikt.
export function getDisplayCookStyle(styleKey) {
  if (!styleKey || styleKey === "neutraal") return null;
  const cookStyle = COOK_STYLES[styleKey];
  const stylistTag = STYLIST_TAGS[styleKey];
  if (!cookStyle) return null;
  if (SHOW_PERSON_NAMES) {
    // Voor persoonlijke-kok tonen we het volledige label
    if (styleKey === "persoonlijke-kok") return { primary: "Persoonlijke Kok", stylistTag };
    // Voor de rest gebruiken we de label (de persoonsnaam zonder extra haakjes)
    return { primary: cookStyle.label, stylistTag };
  }
  // Juridische modus: alleen culinaire stroming, geen persoonsnaam
  return { primary: stylistTag, stylistTag: null };
}

export function getStylistTag(styleKey) {
  return STYLIST_TAGS[styleKey] || null;
}

export const COOK_STYLE_CATEGORY_ORDER = [
  "Aanbevolen",
  "Groenten en mediterraan",
  "Gezondheid en longevity",
  "Low carb, keto en carnivoor",
  "Franse keuken",
  "Italiaanse keuken",
  "Wereldkeuken",
  "BBQ en vlees",
  "Social en comfort",
  "Plantaardig",
  "Nederlandse koks",
  "Belgische koks",
];

export function cookStyleBlock(styleKey) {
  const style = COOK_STYLES[styleKey];
  if (!style || !style.prompt) return "";
  return `\n\nKookstijl die je volgt:\n${style.prompt}`;
}

export function getImageHint(styleKey) {
  const style = COOK_STYLES[styleKey];
  return style?.imageHint || COOK_STYLES["neutraal"].imageHint;
}

export function populateCookStyleDropdown(selectEl, defaultKey = "neutraal") {
  if (!selectEl) return;
  const groups = {};
  Object.entries(COOK_STYLES).forEach(([key, val]) => {
    if (val.category === null) {
      groups["_top"] = groups["_top"] || [];
      groups["_top"].push([key, val]);
    } else {
      groups[val.category] = groups[val.category] || [];
      groups[val.category].push([key, val]);
    }
  });
  const escape = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  let html = "";
  if (groups["_top"]) {
    html += groups["_top"].map(([k, v]) => `<option value="${k}"${k === defaultKey ? " selected" : ""}>${escape(v.label)}</option>`).join("");
  }
  COOK_STYLE_CATEGORY_ORDER.forEach(cat => {
    if (!groups[cat]) return;
    html += `<optgroup label="${escape(cat)}">`;
    html += groups[cat].map(([k, v]) => `<option value="${k}"${k === defaultKey ? " selected" : ""}>${escape(v.label)}</option>`).join("");
    html += `</optgroup>`;
  });
  selectEl.innerHTML = html;
}
