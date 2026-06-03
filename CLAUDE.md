# NVIDIA Contact Page — EDS POC

Adobe Edge Delivery Services proof-of-concept replicating https://www.nvidia.com/en-us/contact/

## Architecture

- **Runtime**: Adobe EDS pattern — no build step, plain ES modules, zero runtime npm deps
- **Entry**: `scripts/aem.js` (EDS core), `scripts/scripts.js` (project entry, three-phase load)
- **Blocks**: each block is a self-contained folder `blocks/{name}/{name}.js` + `blocks/{name}/{name}.css`
- **Content fragments**: `/nav.html` and `/footer.html` are authored content fragments fetched by header/footer block JS
- **Fonts**: declared in `styles/fonts.css`, loaded lazily via `loadFonts()` after first paint
- **Universal Editor**: per-block `_<block>.json` files aggregated by `scripts/build-json.js` into the three `component-*.json` files at the root

## Three-Phase Loading

| Phase | When | What |
|-------|------|-------|
| `loadEager` | Sync, before paint | Decorate main, add `body.appear`, load first section + LCP image |
| `loadLazy` | After first section | Header, remaining sections, footer, lazy-styles.css, fonts |
| `loadDelayed` | 3 s timeout | Third-party scripts, analytics (see `scripts/delayed.js`) |

## Block Conventions

- `export default async function decorate(block)` — required signature
- `data-block-status` progresses: `initialized` → `loading` → `loaded`
- Blocks receive the EDS-decorated DOM (rows as `div > div`, columns as inner `div`)
- **Never** hardcode content in JS — fetch from authored fragments or read from block DOM
- Block JSON files (`_<block>.json`) define Universal Editor fields; run `build:json` after editing

## CSS Conventions

- Design tokens live in `:root` custom properties in `styles/styles.css`
- `--color-nvidia-green: #76b900`, `--color-nvidia-green-dark: #5a8f00`
- `body { opacity: 0 }` → `body.appear { opacity: 1 }` — FOUC prevention
- `header .header[data-block-status="loaded"]` → `visibility: visible` — CLS prevention
- Font fallback: `NVIDIA Sans Fallback` (`size-adjust: 97.5%` on Arial) prevents CLS on font load

## Commands

```bash
# Dev server
npm start                        # serve on :3001
npm stop                         # kill :3001

# Build
npm run build:json               # regenerate component-*.json for Universal Editor

# Linting
npm run lint                     # eslint + stylelint
npm run lint:fix                 # auto-fix all fixable lint errors
npm run lint:js                  # JS only
npm run lint:css                 # CSS only

# Testing
npm test                         # run all 59 Playwright tests (headless)
npm run test:headed              # run with visible browser
npm run test:report              # open last HTML report

# One-time Playwright browser install
npx playwright install chromium

# Run a single test suite by name
npx playwright test --grep "mega menu"
npx playwright test --grep "Contact Info"
npx playwright test --grep "Footer"
```

## Key Files

| File | Purpose |
|------|---------|
| `head.html` | Injected into every page by EDS pipeline (CSP, viewport, scripts, stylesheet) |
| `nav.html` | Authored nav content (brand, Products, Solutions, Industries, utility links) |
| `footer.html` | Authored footer content (nav columns, social, global footer) |
| `styles/styles.css` | LCP-critical base styles + design tokens |
| `styles/fonts.css` | Font-face declarations (loaded lazily) |
| `styles/lazy-styles.css` | Non-critical styles loaded after LCP |
| `scripts/aem.js` | EDS runtime — decorateSections, loadBlock, createOptimizedPicture, sampleRUM |
| `scripts/scripts.js` | Project entry — orchestrates three-phase load |
| `scripts/delayed.js` | Third-party scripts loaded 3 s after page load |
| `scripts/build-json.js` | Scans `blocks/**/_*.json` and `models/_*.json`, emits three root-level component JSON files |
| `blocks/header/header.js` | Sticky nav, mega menu (two-panel), hamburger, overlay, ESC/outside-click close |
| `blocks/footer/footer.js` | Footer columns, social icons, global footer bar |
| `blocks/cards/cards.js` | 3-column contact cards grid |
| `blocks/contact-info/contact-info.js` | Tabbed regional offices (Americas / Asia / Europe) |
| `models/_section.json` | Universal Editor section filter — lists all allowed block IDs |
| `component-definition.json` | **Generated** — UE component list (do not edit manually) |
| `component-models.json` | **Generated** — UE field models (do not edit manually) |
| `component-filters.json` | **Generated** — UE allowed-children rules (do not edit manually) |
| `tests/build-validation.spec.js` | 59 Playwright e2e tests across 7 suites |
| `playwright.config.js` | Test runner config — auto-starts server, two browser projects |
| `fstab.yaml` | AEM Author mountpoint URL (update before AEM Cloud deploy) |
| `paths.json` | AEM content path mappings (update site name before deploy) |
| `TODO.md` | AEM Cloud deployment checklist (8 steps) |
| `PROJECT-FLOW.md` | Architecture diagrams and code-flow reference |

## Universal Editor JSON Pattern

Each block that should be editable in Universal Editor needs a `_<block>.json` file:

```json
{
  "definitions": [{ "title": "My Block", "id": "my-block", "plugins": { "xwalk": { "page": { "resourceType": "core/franklin/components/block/v1/block", "template": { "name": "My Block", "model": "my-block" } } } } }],
  "models": [{ "id": "my-block", "fields": [ { "component": "richtext", "name": "text", "label": "Content" } ] }],
  "filters": []
}
```

Then run `npm run build:json` to merge into the root component JSON files.

## Test Suite Layout

```
tests/build-validation.spec.js
  ├── Suite 1: Static Resources        (13 tests — HTTP 200 for all assets)
  ├── Suite 2: Page Load & EDS Pipeline (8 tests — body.appear, blocks loaded)
  ├── Suite 3: Hero & Cards            (6 tests — content, cards, CTAs)
  ├── Suite 4: Header & Mega Menu      (11 tests — open, close, ESC, overlay, outside click)
  ├── Suite 5: Our Locations           (7 tests — tabs, panels, address content)
  ├── Suite 6: Footer                  (8 tests — columns, social, legal, copyright)
  └── Suite 7: Mobile Responsive       (6 tests — hamburger, hidden elements, stacked layout)
```
