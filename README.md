# Pokémon Card Listing Detector

A Chrome extension (Manifest V3) that detects when the eBay listing you're
viewing is a Pokémon card and adds a small badge with one-click search
shortcuts, so you don't have to retype the card title to look up comps.

## Features
- Detects Pokémon card listings using a scoring system (title, category,
  item specifics, card number, grade)
- Tells single cards apart from sealed product, lots, and suspected fakes
- Detects graded vs. raw cards, and auction vs. fixed-price listings
- Quick links: Google, Google sold, eBay sold listings, and image search,
  all using a cleaned-up version of the listing title
- No APIs, no accounts, no scraping beyond the page you're already viewing

## Install (development)
1. Clone this repo
2. Open `chrome://extensions` and enable Developer mode
3. Click "Load unpacked" and select the project folder
4. Open any eBay `/itm/` listing (eBay item SHOULD be a pokemon card or pokemon related item)

## Project structure
- `selectors.js`: eBay DOM selectors (fix here when eBay changes its markup)
- `detector.js`: Pokémon detection, listing classification, query building
- `content.js`: page scraping, SPA navigation handling, and the badge UI
