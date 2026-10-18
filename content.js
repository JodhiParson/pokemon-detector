(() => {
  let lastKey = "";
  let timer = null;

  function scrapeListing() {
    const isAuction = exists(EBAY.bidButton) || exists(EBAY.bidCount);
    const hasBuyNow = exists(EBAY.buyNow);
    return {
      url: location.href,
      itemId: (location.pathname.match(/\/itm\/(?:[^/]+\/)?(\d+)/) || [])[1] || null,
      title: firstText(EBAY.title),
      price: firstText(EBAY.price),
      listingType: isAuction ? (hasBuyNow ? "auction+buy_now" : "auction") : "fixed_price",
      breadcrumbs: firstText(EBAY.breadcrumbs),
      specifics: firstText(EBAY.itemSpecifics)
    };
  }

  function run() {
    if (!/\/itm\//.test(location.pathname)) return removeBadge();
    const listing = scrapeListing();
    if (!listing.title) return; // page not rendered yet

    const key = listing.itemId + "|" + listing.title;
    if (key === lastKey) return;
    lastKey = key;

    const result = detectPokemonCard(listing);
    console.log("[PokeDetector]", { listing, result });
    result.isPokemon ? showBadge(listing, result) : removeBadge();
  }

  function removeBadge() {
    document.getElementById("poke-detector-badge")?.remove();
  }

  function showBadge(listing, r) {
    removeBadge();
    const el = document.createElement("div");
    el.id = "poke-detector-badge";
    el.style.cssText = `
      position:fixed; right:16px; bottom:16px; z-index:2147483647;
      background:#1f2937; color:#fff; font:13px/1.4 system-ui,sans-serif;
      padding:12px 14px; border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.35);
      max-width:280px;`;
    const label = {
      single_card: "Pokémon card detected",
      sealed_product: "Pokémon sealed product",
      lot: "Pokémon lot / bulk",
      suspected_fake: "Suspected proxy / fake"
    }[r.kind];
    el.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">${label}</div>
      <div style="opacity:.8">${listing.listingType.replace("_", " ")} · ${listing.price || "price n/a"}</div>
      ${r.productType ? `<div style="opacity:.8">Type: ${r.productType}${r.factorySealed ? " · sealed" : ""}</div>` : ""}
      ${r.edition ? `<div style="opacity:.8">Edition/lang: ${r.edition}</div>` : ""}
      ${r.graded ? `<div style="opacity:.8">Graded: ${r.grader} ${r.grade}</div>` : r.isSingleCard ? `<div style="opacity:.8">Raw / ungraded</div>` : ""}
      ${r.cardNumber ? `<div style="opacity:.8">Card #: ${r.cardNumber}</div>` : ""}
      ${(r.isSingleCard || r.isSealed) ? linkButtons(listing.title, r) : ""}
      <div style="opacity:.5;margin-top:6px;font-size:11px">confidence score: ${r.score}</div>`;
    document.body.appendChild(el);
  }

  function linkButtons(title, r) {
    const l = buildLinks(title);
    const btn = (href, text) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;margin:6px 6px 0 0;padding:5px 9px;border-radius:6px;
                 background:#3b82f6;color:#fff;text-decoration:none;font-size:12px">${text}</a>`;
    return `
      <div style="margin-top:8px;opacity:.65;font-size:11px;word-break:break-word">Search: ${l.query}</div>
      <div>
        ${btn(l.google, "Google")}
        ${btn(l.googleSold, "Google sold")}
        ${btn(l.ebaySold, "eBay sold")}
        ${btn(l.tcgplayer, "TCGplayer")}
        ${btn(l.googleImages, "Images")}
      </div>`;
  }

  // Debounced so we don't re-run on every DOM mutation
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 400);
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  run();
})();