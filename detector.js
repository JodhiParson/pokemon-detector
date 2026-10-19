// Pure logic: takes plain strings, returns a verdict. No DOM access here,
// so it's easy to test in Node or the console.

const GRADERS = /\b(PSA|BGS|CGC|SGC|TAG|ACE)\s?(\d{1,2}(\.5)?)\b/i;
const CARD_NUMBER = /\b(\d{1,3})\s?\/\s?(\d{1,3})\b|\b(SV|SWSH|SM|XY|BW|HGSS)\d{1,3}\b|\b[A-Z]{2,4}\d{1,3}\/[A-Z]{2,4}\d{1,3}\b/i;
const CARD_TERMS = /\b(holo|reverse holo|full art|alt art|illustration rare|special illustration|secret rare|ultra rare|hyper rare|1st edition|first edition|shadowless|vmax|vstar|\bV\b|\bGX\b|\bex\b|prism|promo|rainbow)\b/i;
const LOT_TERMS = /\b(lot of|bulk|bundle of|\d+\s?cards?\s?lot|mystery|random|you pick|choose your)\b/i;
const FAKE_TERMS = /\b(proxy|custom|replica|orica|fan.?made|reprint|fake|metal card)\b/i;

// Sealed product types, ordered most specific first. First match wins the label.
const PRODUCT_TYPES = [
  [/\bultra[- ]premium collection\b|\bupc\b/i, "Ultra Premium Collection"],
  [/\bpremium collection\b/i, "Premium Collection"],
  [/\belite trainer box\b|\betb\b|\btrainer box\b/i, "Elite Trainer Box"],
  [/\bbooster bundle\b/i, "Booster Bundle"],
  [/\bbooster box\b|\bbooster display\b|\b36[- ]pack\b/i, "Booster Box"],
  [/\bbooster pack\b|\bsealed pack\b|\bsingle pack\b/i, "Booster Pack"],
  [/\bbuild (&|and) battle\b/i, "Build & Battle"],
  [/\b(starter|theme|battle|league battle) deck\b/i, "Deck"],
  [/\bcollection box\b|\bcollection\b.*\bbox\b/i, "Collection Box"],
  [/\bblister\b|\b3[- ]pack\b/i, "Blister"],
  [/\bmini tin\b/i, "Mini Tin"],
  [/\bpok[eé]mon tin\b|\b\w+\s+tin\b/i, "Tin"],
  [/\bsealed case\b|\bbooster case\b|\bcase fresh\b/i, "Case"]
];
const FACTORY_SEALED = /\b(factory sealed|sealed|new in box|nib|brand new)\b/i;

// Era / set names. Helps catch sealed titles that omit the word "Pokemon".
const SET_NAMES = /\b(scarlet (&|and) violet|sword (&|and) shield|sun (&|and) moon|black (&|and) white|base set|jungle|fossil|team rocket|neo (genesis|discovery|destiny|revelation)|evolving skies|crown zenith|paldean fates|prismatic evolutions|temporal forces|twilight masquerade|stellar crown|surging sparks|obsidian flames|paradox rift|paldea evolved|151|shrouded fable|lost origin|silver tempest|brilliant stars|fusion strike|celebrations|champion'?s path|hidden fates|shining fates|vivid voltage|darkness ablaze|rebel clash|cosmic eclipse|unified minds|lost thunder|burning shadows|guardians rising|journey together|destined rivals|black bolt|white flare|mega evolution|phantasmal flames)\b/i;

function detectProductType(title) {
  for (const [re, label] of PRODUCT_TYPES) if (re.test(title)) return label;
  return null;
}

function detectPokemonCard({ title, breadcrumbs = "", specifics = "", knownPokemon = false }) {
  let score = 0;
  const reasons = [];
  const add = (pts, why) => { score += pts; reasons.push(`+${pts} ${why}`); };

  const graded = GRADERS.test(title);
  const productType = detectProductType(title);
  const looksSealed = !graded && (productType !== null || /\bfactory sealed\b/i.test(title));

  if (knownPokemon) add(4, "site confirms Pokemon (URL / category)");
  if (/pok[eé]mon/i.test(title)) add(3, "title mentions Pokemon");
  if (/pok[eé]mon/i.test(breadcrumbs)) add(2, "category mentions Pokemon");
  if (/(CCG Individual Cards|Collectible Card Games|Sealed Boxes|Sealed Packs)/i.test(breadcrumbs)) add(1, "TCG category");
  if (/Game\W{0,3}Pok[eé]mon/i.test(specifics)) add(3, "item specifics: Game = Pokemon");
  if (CARD_NUMBER.test(title)) add(1, "card number in title");
  if (graded) add(1, "grader + grade in title");
  if (CARD_TERMS.test(title)) add(1, "card term (holo/ex/VMAX...)");
  if (looksSealed) add(1, `sealed product term (${productType || "factory sealed"})`);
  const hasSet = SET_NAMES.test(title);
  if (hasSet) add(1, "set / era name");
  if (hasSet && productType && !graded) add(2, "known set + sealed product type");

  const isPokemon = score >= 4;

  let kind = "single_card";
  if (looksSealed) kind = "sealed_product";
  if (LOT_TERMS.test(title)) kind = "lot";
  if (FAKE_TERMS.test(title)) kind = "suspected_fake";

  const g = title.match(GRADERS) || [];
  return {
    isPokemon,
    isSingleCard: isPokemon && kind === "single_card",
    isSealed: isPokemon && kind === "sealed_product",
    kind,
    score,
    reasons,
    productType: kind === "sealed_product" ? productType : null,
    factorySealed: FACTORY_SEALED.test(title),
    graded,
    grader: g[1] ? g[1].toUpperCase() : null,
    grade: g[2] || null,
    cardNumber: (title.match(CARD_NUMBER) || [null])[0],
    edition: (title.match(/\b(1st edition|first edition|unlimited|shadowless|japanese|korean|chinese|german|french|spanish|italian)\b/i) || [null])[0]
  };
}

// Turns messy seller title into a clean search query.
// Strips hype words, emojis and punctuation but keeps name, number, grade
// and (for sealed product) the product type.
const NOISE = /\b(l@@k|look|wow|nm|nm\/mt|near mint|mint|free shipping|fast shipping|fast ship|must see|hot|rare!*|no reserve|nr|authentic|official|tcg|ccg|card|cards|mavin|bgs\/psa|pop \d+|low pop|investment|great|beautiful|gem|brand new|in stock|ships? (today|fast)|usa|us seller)\b/gi;

function buildSearchQuery(title) {
  let q = title
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, " ") // emojis
    .replace(NOISE, " ")
    .replace(/[!*~|•–—]+/g, " ")
    .replace(/\s-\s/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/pok[eé]mon/i.test(q)) q = "pokemon " + q;
  return q;
}

function buildLinks(title) {
  const q = buildSearchQuery(title);
  const enc = encodeURIComponent;
  return {
    query: q,
    google: `https://www.google.com/search?q=${enc(q)}`,
    googleSold: `https://www.google.com/search?q=${enc(q + " sold price")}`,
    googleImages: `https://www.google.com/search?tbm=isch&q=${enc(q)}`,
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}&LH_Sold=1&LH_Complete=1&_sop=13`,
    tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${enc(q.replace(/^pokemon\s+/i, ""))}`
  };
}