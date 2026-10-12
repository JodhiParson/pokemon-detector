// Pure logic: takes plain strings, returns a verdict. No DOM access here,
// so it's easy to test in Node or the console.

const GRADERS = /\b(PSA|BGS|CGC|SGC|TAG|ACE)\s?(\d{1,2}(\.5)?)\b/i;
const CARD_NUMBER = /\b(\d{1,3})\s?\/\s?(\d{1,3})\b|\b(SV|SWSH|SM|XY|BW|HGSS)\d{1,3}\b|\b[A-Z]{2,4}\d{1,3}\/[A-Z]{2,4}\d{1,3}\b/i;
const CARD_TERMS = /\b(holo|reverse holo|full art|alt art|illustration rare|special illustration|secret rare|ultra rare|hyper rare|1st edition|first edition|shadowless|vmax|vstar|\bV\b|\bGX\b|\bex\b|prism|promo|rainbow)\b/i;
const SEALED_TERMS = /\b(booster box|booster bundle|elite trainer|etb|sealed|display|blister|tin|collection box|booster pack|build & battle|starter deck|theme deck)\b/i;
const LOT_TERMS = /\b(lot of|bulk|bundle of|\d+\s?cards?\s?lot|mystery|random|you pick|choose your)\b/i;
const FAKE_TERMS = /\b(proxy|custom|replica|orica|fan.?made|reprint|fake|metal card)\b/i;

function detectPokemonCard({ title, breadcrumbs = "", specifics = "" }) {
  let score = 0;
  const reasons = [];
  const add = (pts, why) => { score += pts; reasons.push(`+${pts} ${why}`); };

  if (/pok[eé]mon/i.test(title)) add(3, "title mentions Pokemon");
  if (/pok[eé]mon/i.test(breadcrumbs)) add(2, "category mentions Pokemon");
  if (/(CCG Individual Cards|Collectible Card Games)/i.test(breadcrumbs)) add(1, "TCG category");
  if (/Game\W{0,3}Pok[eé]mon/i.test(specifics)) add(3, "item specifics: Game = Pokemon");
  if (CARD_NUMBER.test(title)) add(1, "card number in title");
  if (GRADERS.test(title)) add(1, "grader + grade in title");
  if (CARD_TERMS.test(title)) add(1, "card term (holo/ex/VMAX...)");

  const isPokemon = score >= 4;

  let kind = "single_card";
  if (LOT_TERMS.test(title)) kind = "lot";
  else if (SEALED_TERMS.test(title) && !GRADERS.test(title)) kind = "sealed_product";
  if (FAKE_TERMS.test(title)) kind = "suspected_fake";

  const grade = (title.match(GRADERS) || []);
  return {
    isPokemon,
    isSingleCard: isPokemon && kind === "single_card",
    kind,
    score,
    reasons,
    graded: grade.length > 0,
    grader: grade[1] ? grade[1].toUpperCase() : null,
    grade: grade[2] || null,
    cardNumber: (title.match(CARD_NUMBER) || [null])[0]
  };
}

// Turns a messy seller title into a clean search query.
// Strips hype words, emojis and punctuation but keeps name, number and grade.
const NOISE = /\b(l@@k|look|wow|nm|nm\/mt|near mint|mint|free shipping|fast shipping|fast ship|must see|hot|rare!*|no reserve|nr|authentic|official|tcg|ccg|card|cards|mavin|bgs\/psa|pop \d+|low pop|investment|great|beautiful|gem)\b/gi;

function buildSearchQuery(title) {
  let q = title
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, " ") // emojis
    .replace(NOISE, " ")
    .replace(/[!*~|•–—]+/g, " ")
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
    ebaySold: `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}&LH_Sold=1&LH_Complete=1&_sop=13`
  };
}
