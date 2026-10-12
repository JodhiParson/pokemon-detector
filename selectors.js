// All eBay-specific DOM selectors live here. When eBay changes its markup,
// this is the only file you should need to fix. Verify in DevTools.
const EBAY = {
  title: ["h1.x-item-title__mainTitle span", "h1.x-item-title__mainTitle", "h1"],
  price: [".x-price-primary span", ".x-price-primary", "[itemprop='price']"],
  breadcrumbs: ["nav.breadcrumbs", ".seo-breadcrumb-text", "[class*='breadcrumb']"],
  itemSpecifics: [".x-about-this-item", "[data-testid='ux-layout-section-evo']", ".ux-layout-section--features"],
  bidButton: ["[data-testid='x-bid-action']", "a[href*='bid']", ".x-bid-action"],
  bidCount: [".x-bid-count", "[data-testid='x-bid-count']"],
  buyNow: ["[data-testid='x-bin-action']", ".x-bin-action"]
};

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
