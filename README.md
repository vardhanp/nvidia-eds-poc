# NVIDIA Contact Page — EDS POC

A proof-of-concept replicating [nvidia.com/en-us/contact](https://www.nvidia.com/en-us/contact/) built with **Adobe Edge Delivery Services (EDS)** patterns — zero build step, plain ES modules, no runtime dependencies.

---

## Quick Start

```bash
git clone <repo-url> && cd edsprojectsetup
npm install                              # install dev tools
npx playwright install chromium          # install test browser (once)
npm start                                # serve at http://localhost:3001
```

Open **http://localhost:3001** in Chrome.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Install](#install)
4. [Run the Dev Server](#run-the-dev-server)
5. [Build Scripts](#build-scripts)
6. [Linting](#linting)
7. [Testing](#testing)
8. [Deploying to AEM Cloud](#deploying-to-aem-cloud)
9. [How EDS Works](#how-eds-works)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

---

## Prerequisites

| Tool | Min version | Check |
|------|-------------|-------|
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| Git | any | `git --version` |
| Chrome / Edge | latest | — |

Install Node.js from https://nodejs.org (LTS recommended).

---

## Project Structure

```
edsprojectsetup/
│
├── index.html                   ← Main contact page (EDS-authored HTML)
├── head.html                    ← <head> injected by EDS (CSP, viewport, links)
├── nav.html                     ← Authored nav fragment (fetched by header block)
├── footer.html                  ← Authored footer fragment (fetched by footer block)
├── 404.html                     ← Custom not-found page
│
├── scripts/
│   ├── aem.js                   ← EDS runtime (block loader, decorators, RUM)
│   ├── scripts.js               ← Entry point: loadEager → loadLazy → loadDelayed
│   ├── delayed.js               ← Analytics and non-critical third-party scripts
│   └── build-json.js            ← Generates component-*.json for Universal Editor
│
├── styles/
│   ├── styles.css               ← Critical base styles + NVIDIA design tokens
│   ├── lazy-styles.css          ← Non-critical styles loaded after first paint
│   └── fonts.css                ← @font-face declarations (NVIDIA Sans, Font Awesome)
│
├── blocks/
│   ├── hero/                    ← hero.js + hero.css
│   ├── cards/                   ← cards.js + cards.css  (3 contact cards)
│   ├── contact-info/            ← contact-info.js + contact-info.css  (regional tabs)
│   ├── header/                  ← header.js + header.css  (sticky nav + mega menu)
│   └── footer/                  ← footer.js + footer.css
│
├── models/
│   └── _section.json            ← Universal Editor section filter
│
├── component-definition.json    ← UE component list (auto-generated — do not edit)
├── component-models.json        ← UE field models  (auto-generated — do not edit)
├── component-filters.json       ← UE allowed children (auto-generated — do not edit)
│
├── tests/
│   └── build-validation.spec.js ← Playwright end-to-end test suite (59 tests)
│
├── playwright.config.js         ← Test runner config (two projects: Chrome + Safari)
├── package.json                 ← Scripts and dev dependencies
├── fstab.yaml                   ← AEM mountpoint (update before AEM Cloud deploy)
├── paths.json                   ← AEM content path mappings
│
├── TODO.md                      ← AEM Cloud deployment checklist
├── PROJECT-FLOW.md              ← Architecture and code-flow reference
├── CLAUDE.md                    ← AI-assistant context (conventions, commands)
└── icons/
    └── icon.svg                 ← Favicon
```

---

## Install

Run once after cloning (or after adding new dependencies):

```bash
npm install
```

This installs all dev tools: `serve`, `@playwright/test`, ESLint, Stylelint, Husky, and the AEM CLI.

### Install Playwright browsers

Playwright needs browser binaries to run the test suite. Install once:

```bash
npx playwright install chromium
```

To also install WebKit (Mobile Safari) binaries:

```bash
npx playwright install chromium webkit
```

---

## Run the Dev Server

### Option A — Simple static server (recommended for local POC)

```bash
npm start
```

Runs `npx serve . --listen 3001` and serves the project at **http://localhost:3001**.

**What you should see:**
- Sticky NVIDIA header with logo, Products / Solutions / Industries mega menu
- Hero section: "Contact NVIDIA — Get Your Questions Answered."
- Three cards: Support · Enterprise Sales · Find a Partner
- Our Locations with Americas / Asia / Europe tabs
- NVIDIA-styled footer with social icons

**Stop the server:**

```bash
# Ctrl + C  (in the same terminal)
# — or —
npm stop    # kills the process bound to port 3001 from any terminal
```

> `npm stop` runs `npx kill-port 3001`. Useful when the server was started in the background or inside an IDE task runner.

---

### Option B — AEM CLI (hot-reload, AEM-proxied content)

```bash
npm install -g @adobe/aem-cli     # install globally once
aem up                            # starts at http://localhost:3000
```

The AEM CLI provides:
- **Hot reload** — CSS/JS changes refresh the browser instantly
- **Content proxy** — fetches page content from the configured AEM origin (set in `fstab.yaml`)

> Port 3000 is the AEM CLI default. The static server (`npm start`) uses 3001 to avoid conflicts when running both side-by-side.

---

### Option C — Python (no Node.js required)

```bash
python -m http.server 3001
```

Open **http://localhost:3001**. Works for viewing; ES modules require Python 3 for correct MIME types.

---

## Build Scripts

### Generate Universal Editor component JSON

The three `component-*.json` files are auto-generated from per-block `_*.json` source files. They are **committed to the repo** so AEM/Universal Editor can read them at deploy time.

```bash
npm run build:json
```

Re-run whenever you add or modify a block's `_<block>.json` file. The script:

1. Scans `blocks/**/_*.json` and `models/_*.json`
2. Merges definitions → `component-definition.json`
3. Merges field models → `component-models.json`
4. Merges allowed-children filters → `component-filters.json`

> **Never edit** `component-*.json` directly — they will be overwritten on the next build.

The Husky pre-commit hook runs `build:json` and re-stages the generated files automatically on every `git commit` (once the repo has a `.git` directory).

---

## Linting

```bash
npm run lint          # ESLint (JS) + Stylelint (CSS)
npm run lint:js       # JavaScript only
npm run lint:css      # CSS only
npm run lint:fix      # auto-fix all fixable issues
```

Rules:
- **JS**: ESLint with `airbnb-base` ruleset (see `.eslintrc.js`)
- **CSS**: Stylelint with `stylelint-config-standard` (see `.stylelintrc.json`)

Run `npm run lint` before committing. The CI pipeline (`.github/workflows/main.yaml`) runs it automatically on every push.

---

## Testing

The project ships with a **Playwright end-to-end test suite** that starts the dev server automatically, loads the page in a real browser, and verifies every major feature.

### One-time setup

```bash
npm install                      # installs @playwright/test
npx playwright install chromium  # downloads Chromium browser binary (~180 MB)
```

### Run the tests

| Command | What it does |
|---------|-------------|
| `npm test` | Headless — all 59 tests on Desktop Chrome (CI-friendly) |
| `npm run test:headed` | Same tests with a visible browser window |
| `npm run test:report` | Open the last HTML report in the browser |
| `npx playwright test --grep "mega menu"` | Run only tests matching a name |
| `npx playwright test --grep "Contact Info"` | Run only the contact-info suite |
| `npm test -- --project="Mobile Safari"` | Run on Mobile Safari (iPhone 12) |
| `npm test -- --project="Desktop Chrome"` | Run on Desktop Chrome only |

### What the tests cover (59 tests across 7 suites)

| Suite | Tests | What it validates |
|-------|-------|-------------------|
| **Static Resources** | 13 | All CSS, JS, HTML, and font files return HTTP 200 |
| **Page Load & EDS Pipeline** | 8 | `body.appear`, block decoration lifecycle, no broken images, all stylesheets injected |
| **Hero & Cards** | 6 | Hero h1 text, subtitle, background class, 3 cards with correct titles and CTAs |
| **Header & Mega Menu** | 11 | Logo, nav links, mega menu open/close (click, ESC, overlay, outside click), category switching, Solutions categories |
| **Our Locations** | 7 | Heading, subtitle, 3 region tabs, tab switching, Americas address content |
| **Footer** | 8 | Main footer columns, headings, social icons, global footer, legal links, copyright |
| **Mobile Responsive** | 6 | Hamburger visible, utility links hidden, mega menu hidden, hamburger toggle, cards stacked |

### Example output

```
Running 59 tests using 1 worker

  ok  1 › Static Resources › CSS responds 200: /styles/styles.css
  ok  2 › Static Resources › CSS responds 200: /styles/lazy-styles.css
  ...
  ok 59 › Mobile Responsive (375px) › cards stack vertically on mobile

  59 passed (43s)
```

### HTML test report

After every run an HTML report is written to `playwright-report/`. Open it with:

```bash
npm run test:report
```

The report shows pass/fail status, duration, screenshots on failure, and execution traces.

### Test configuration

Key settings in `playwright.config.js`:

| Setting | Value |
|---------|-------|
| `testDir` | `./tests` |
| `timeout` | 30 s per test |
| `retries` | 1 (auto-retry on failure) |
| `webServer` | `npm start` — auto-starts the server before tests, stops it after |
| `baseURL` | `http://localhost:3001` |
| Projects | Desktop Chrome (1280×720) · Mobile Safari / iPhone 12 (390×844) |

> The web server is reused if it is already running (`reuseExistingServer: true`), so you can run `npm start` in one terminal and `npm test` in another without restarting the server.

---

## Deploying to AEM Cloud

See **[TODO.md](./TODO.md)** for the complete step-by-step checklist. The high-level steps are:

1. Update `fstab.yaml` with your AEM Author URL
2. Update `paths.json` with your AEM site name
3. Install the AEM Code Sync GitHub App on your repo
4. Configure Edge Delivery Services in Adobe Cloud Manager
5. Publish content from AEM Sites
6. Verify Universal Editor integration
7. Install the AEM Sidekick browser extension

After AEM and GitHub are connected, the site is live at:

```
Preview:  https://main--<repo>--<org>.aem.page/
Live:     https://main--<repo>--<org>.aem.live/
```

---

## How EDS Works

```
Browser loads index.html
        │
        ▼
scripts.js (type="module")
        │
        ├─► loadEager()    — sync, before paint
        │       └─ decorateMain()
        │               ├─ decorateSections()   → wraps sections in divs, hides them
        │               └─ decorateBlocks()     → adds .block class + data-block-name attr
        │
        ├─► loadLazy()     — after first section is painted
        │       ├─ for each .block:
        │       │       ├─ loads /blocks/<name>/<name>.css
        │       │       ├─ imports /blocks/<name>/<name>.js
        │       │       ├─ calls decorate(block)
        │       │       └─ sets data-block-status="loaded", reveals section
        │       ├─ loads header block (nav.html → sticky nav + mega menu)
        │       ├─ loads footer block (footer.html → links + social icons)
        │       └─ loads lazy-styles.css and fonts.css
        │
        └─► loadDelayed()  — after 3 s
                └─ analytics, chat widgets, any non-critical third-party scripts
```

### Block anatomy

```
blocks/my-block/
├── my-block.css    ← scoped to .my-block { ... }
└── my-block.js     ← export default async function decorate(block) { ... }
```

The `decorate(block)` function receives the raw EDS DOM element (table rows become nested `div > div` children) and reshapes it into whatever HTML the block needs.

---

## Troubleshooting

### Page is blank or stays black

`body` starts with `opacity: 0` and only becomes visible after `scripts.js` runs and adds `body.appear`. If this never happens:

- Open DevTools (`F12`) → Console — look for module import errors
- Make sure you are serving over HTTP (`http://localhost:3001`), not opening `index.html` directly as a `file://` URL — ES modules do not work with `file://`
- Confirm the server is running on port 3001

### "Failed to fetch" / "Failed to load module" in console

The block file path must exactly match the block's CSS class name:

```
blocks/contact-info/contact-info.js   ✓
blocks/contactInfo/contactInfo.js     ✗  (EDS expects kebab-case)
```

### Port 3001 is already in use

```bash
npm stop           # kills the process on port 3001
# — or —
npx kill-port 3001
# — then —
npm start
```

### Tests fail with "browser not found"

Install the Playwright browser binaries:

```bash
npx playwright install chromium
```

### Tests fail with "connection refused" on port 3001

The test suite auto-starts the server. If it can't start:

```bash
npm stop           # free the port if it's already in use
npm test           # re-run — Playwright starts the server automatically
```

### Lint errors on commit

The CI pipeline runs `npm run lint` automatically. Fix locally first:

```bash
npm run lint:fix   # auto-fixes most issues
npm run lint       # verify clean
```

### `build:json` warnings about missing `.json` files

Each block folder needs a `_<block>.json` file for Universal Editor support. See the `blocks/hero/_hero.json` file as a template.

### npm not found

Install Node.js (LTS) from https://nodejs.org — npm is bundled with it.

---

## npm Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `npx serve . --listen 3001` | Start static dev server on port 3001 |
| `npm stop` | `npx kill-port 3001` | Kill the process on port 3001 |
| `npm run build:json` | `node scripts/build-json.js` | Regenerate Universal Editor component JSON |
| `npm run lint` | eslint + stylelint | Lint all JS and CSS files |
| `npm run lint:js` | eslint | Lint JS only |
| `npm run lint:css` | stylelint | Lint CSS only |
| `npm run lint:fix` | eslint --fix + stylelint --fix | Auto-fix all fixable lint issues |
| `npm test` | `playwright test` | Run full Playwright test suite (headless) |
| `npm run test:headed` | `playwright test --headed` | Run tests with visible browser |
| `npm run test:report` | `playwright show-report` | Open last HTML test report |
| `npm run prepare` | `husky` | Install Husky git hooks (auto-run after `npm install`) |

---

## References

| Resource | URL |
|----------|-----|
| EDS Developer Tutorial | https://www.aem.live/developer/tutorial |
| AEM Boilerplate (GitHub) | https://github.com/adobe/aem-boilerplate |
| AEM Boilerplate XWalk (Universal Editor) | https://github.com/adobe/aem-boilerplate-xwalk |
| AEM CLI (npm) | https://www.npmjs.com/package/@adobe/aem-cli |
| Block Collection | https://www.aem.live/developer/block-collection |
| Playwright Docs | https://playwright.dev/docs/intro |
| AEM Sidekick Extension | https://chromewebstore.google.com/detail/aem-sidekick/ccfggkjabjahcjoljmgmklhpaccedipo |
