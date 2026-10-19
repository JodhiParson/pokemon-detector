// Everything site-specific lives in this file. When a site changes its markup,
// this is the only file you should need to fix. Verify selectors in DevTools.

function firstText(selectors) {
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el.textContent.trim()) return el.textContent.trim();
  }
  return "";
}

function exists(selectors) {
  return selectors.some((s) => document.querySelector(s));
}

const EBAY = {
  title: ["h1.x-item-title__mainTitle span", "h1.x-item-title__mainTitle", "h1"],
  price: [".x-price-primary span", ".x-price-primary", "[itemprop='price']"],
  breadcrumbs: ["nav.breadcrumbs", ".seo-breadcrumb-text", "[class*='breadcrumb']"],
  itemSpecifics: [".x-about-this-item", "[data-testid='ux-layout-section-evo']", ".ux-layout-section--features"],
  bidButton: ["[data-testid='x-bid-action']", "a[href*='bid']", ".x-bid-action"],
  bidCount: [".x-bid-count", "[data-testid='x-bid-count']"],
  buyNow: ["[data-testid='x-bin-action']", ".x-bin-action"]
};

const TCG = {
  title: ["h1.product-details__name", "h1[class*='product-details__name']", "h1"],
  setName: [".product-details__set a", "[class*='product-details__set']", "a[href*='/categories/trading-and-collectible-card-games/pokemon/']"],
  price: [".spotlight__price", "[class*='spotlight__price']", ".price-points__upper__price"],
  breadcrumbs: ["nav[aria-label='breadcrumb']", "[class*='breadcrumb']"]
};

// Each adapter: does this URL look like a product page, and how do we read it?
const SITES = {
  ebay: {
    id: "ebay",
    matchesHost: () => /(^|\.)ebay\./.test(location.hostname),
    isListingPage: () => /\/itm\//.test(location.pathname),
    scrape() {
      const isAuction = exists(EBAY.bidButton) || exists(EBAY.bidCount);
      const hasBuyNow = exists(EBAY.buyNow);
      return {
        site: "ebay",
        url: location.href,
        itemId: (location.pathname.match(/\/itm\/(?:[^/]+\/)?(\d+)/) || [])[1] || null,
        title: firstText(EBAY.title),
        price: firstText(EBAY.price),
        listingType: isAuction ? (hasBuyNow ? "auction+buy_now" : "auction") : "fixed_price",
        breadcrumbs: firstText(EBAY.breadcrumbs),
        specifics: firstText(EBAY.itemSpecifics),
        knownPokemon: false
      };
    }
  },

  tcgplayer: {
    id: "tcgplayer",
    matchesHost: () => /(^|\.)tcgplayer\.com$/.test(location.hostname),
    // TCGplayer is a SPA: the URL changes without a page load, so we check the path each time.
    isListingPage: () => /^\/product\/\d+\//.test(location.pathname),
    scrape() {
      // URL looks like /product/283389/pokemon-sv-scarlet-and-violet-151-charizard-ex-199-165
      const m = location.pathname.match(/^\/product\/(\d+)\/([^/?#]+)/) || [];
      const slug = m[2] || "";
      const slugTitle = slug
        .replace(/-/g, " ")
        .replace(/\b(\d{1,3}) (\d{1,3})$/, "$1/$2") // trailing "199 165" -> "199/165"
        .trim();

      const nameDom = firstText(TCG.title);
      const setDom = firstText(TCG.setName);
      // Prefer the rendered title + set; fall back to the URL slug, which is always present.
      const title = nameDom ? [nameDom, setDom].filter(Boolean).join(" ") : slugTitle;

      return {
        site: "tcgplayer",
        url: location.href,
        itemId: m[1] || null,
        title,
        price: firstText(TCG.price),
        listingType: "tcgplayer_product",
        breadcrumbs: firstText(TCG.breadcrumbs),
        specifics: "",
        // Slugs for Pokemon products start with "pokemon-". Treat that as confirmation.
        knownPokemon: /^pokemon-/i.test(slug) || /pok[eé]mon/i.test(firstText(TCG.breadcrumbs))
      };
    }
  }
};

function currentSite() {
  return Object.values(SITES).find((s) => s.matchesHost()) || null;
}