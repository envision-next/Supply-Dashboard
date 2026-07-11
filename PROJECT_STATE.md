# PROJECT_STATE.md — current context for a fresh Claude session

Read this after `CLAUDE.md` and `README.md`. It captures where the project stands, what was
built recently, where the important code lives, and the open issues — so a new session continues
without re-discovering everything.

## What this project is
**RERA Easy — Maharashtra real-estate market intelligence.** A single, self-contained, offline
HTML dashboard (hand-drawn inline SVG charts, **no external libraries/CDNs**), plus a Word report
and a static mailer, all generated from one MahaRERA Excel export via the `src/` pipeline.

## Repo / deploy
- **GitHub:** https://github.com/envision-next/Supply-Dashboard (branch `main`, public).
- Git identity set locally: `envision-next` / `envisionnexttech@gmail.com`.
- **GitHub Pages** serves `index.html` at repo root → https://envision-next.github.io/Supply-Dashboard/
- `.nojekyll` is committed (static serve). **OPEN ISSUE:** the live Pages site has been serving a
  stale/old build (footer showed the old `53,536` count). This is a *deployment/caching* issue,
  not code — the code on `main` is current. To resolve: check **Settings → Pages** = Deploy from a
  branch → `main` → `/root`, and the **Actions** tab for a failed/stuck "pages build and deployment".
  A cache-buster like `…/index.html?v=<sha>` bypasses browser/CDN cache.

## Data (current)
- Rebuilt from `C:\Users\Admin\Downloads\clean data.xlsx` (21 cols, identical schema to the old file).
- **53,095 projects** after cleaning. Dict sizes: div 9, dist 39, tal 278, vil 2391, pin 1073, bank 120.
- Sanity check: **pincode 410210 = 183 projects**, spanning Raigad·Konkan (178) + Thane·Konkan (5).
- **OPEN ISSUE:** the stored raw file `data/Project RERA stats - Raw Data.xlsx` is still the OLD file
  because it was locked (open in Excel) and could not be overwritten. `data.json`/`stats.json` and all
  built artifacts ARE the new data. Once Excel is closed, copy the new xlsx over the stored raw file
  and rebuild so the repo is self-consistent. `prep.py` reads columns by POSITION, so schema must match.

## Build / rebuild (Windows)
Python is invoked as **`py`** (not `python`). Node is available. From project root:
```
py src/prep.py "C:/Users/Admin/Downloads/clean data.xlsx"   # or default data/…Raw Data.xlsx
py src/build_stats.py
py src/build_dashboard.py            # writes BOTH "RERA Market Analysis Dashboard.html" and index.html
node src/build_doc.js                # Word .docx (needs node_modules/docx)
```
`build_dashboard.py` now also writes `index.html` (the Pages site root) on every run.

## Hard rules / conventions (do not break)
- Dashboard is **one self-contained file, no external libs/CDNs**; all charts are inline SVG.
- Template JS uses **string concatenation only — NO backtick template literals** (survives shell here-docs).
- Edit `src/dashboard_template.html` (the SOURCE), then **rebuild**; never hand-edit the generated HTML.
- After any template edit: rebuild, then **syntax-check** the injected script:
  extract the single `<script>` block from `index.html` and run `node --check` on it.
- **Desktop layout must stay unchanged** when adding mobile rules — gate everything behind
  `@media(max-width:720px)` (and `430px`) / `window.innerWidth<=720`.
- A repo hook (**GateGuard fact-forcing**) intercepts the first Bash and the first edit to a file each
  "streak": present the 4 facts (importers / functions affected / data I/O / verbatim user instruction)
  then retry. Batch consecutive template edits to only trip it once. Commit/push ONLY when the user says.

## Data model recap (`data/data.json`)
Columnar + dictionary-encoded. `dict` string tables: `ptype,pstatus,cstatus,div,dist,tal,vil,pin,bank`.
`cols` parallel arrays per project: `yr,mo, pt,ps,cs, dv,di,ta,vi,pn (geo), bk, cl (RERA clientele 0/1),
un,la,ca,bu,pf,cp,dy`. Geo is a strict hierarchy Division→District→Taluka→Village→Pincode; **pincode is
globally deduped in the dict**, so one pincode can span multiple parent geographies. `cs`: 0 Active,
1 Lapsed, 2 Completed. `ca`/`dy` may be null (skip in sums/avgs).

## Key runtime state in the template
- `path[]` — geographic drill (each `{lvl,code,name}`). `F` — filters: `ptype,pstatus,cstatus,cli(set),
  bank(set|null), pin(code|null), yrMin,yrMax`. `viewDim` ∈ geo|pt|ps|bk.
- **`F.pin`** (added this work) = a pincode leaf filter used INSTEAD of a path, because a pincode isn't a
  single hierarchical node. `passFilter` honours it; `aggregate()` groups; a removable PIN chip shows in
  the drillbar; cleared on reset / returning to Maharashtra root.

## Features added in recent sessions (all on `main`)
1. **Mobile-optimised layout** — off-canvas filter drawer (☰ Filters), responsive line charts
   (`lineChartMulti`/`lineChart` use a ~560×400 viewBox + bigger fonts when `innerWidth<=720`),
   stacked donut+legend, single-column cards/table.
2. **Pincode search fix** — searched pincode sets `F.pin` (true total, e.g. 410210 → 183) and the
   answer lists every district/division it spans. Root cause was `buildPathTo()` returning only the
   first matching row's full path. See `applyEntry()` / `renderDrillbar()` / `passFilter()`.
3. **Master card** (`masterCardHTML`, `wireMaster`, `computeMasterTrend`):
   - KPI tiles show **% of / delta vs Maharashtra** (baseline ignores geo/bank/pin AND clientele).
     In **RERA preview** (`masterReraOnly`) the KPIs read as clientele penetration of Maharashtra (`showPct`).
   - **Location parameters** block; Top-5 children section names the scope.
   - **Delivery-risk watchlist** (`renderWatch`, `masterWatch`): weakest child geographies with a metric
     selector (Risk score / Lapse% / Low completion / Weakest YoY growth) + a year filter.
4. **Compare** (`openCompare`, `compareHeaderHTML`, `buildCompareReport`, `scopeAgg`):
   - Chooser: quick buttons (Current vs Parent, Current vs Maharashtra) + a **two-location** picker with
     **cascading drill-down** per side (`renderCmpSel`, `cmpPathA/cmpPathB`), plus per-side **ticks**
     for **Current** (default on) / **Maharashtra** (mutually exclusive; drilling unticks them) and a
     **RERA Easy only** modifier.
   - Per-side flags threaded through everything: `reraA/reraB` (via `masterReraMap`), `pinA/pinB`
     (via `masterPinMap`). A RERA/blank side **inherits the other side's place AND pincode**.
   - **Head-to-head** section (rendered BELOW the two master cards): per row shows each side's value plus,
     in brackets, its **share of the other** — A `(X% of B)`, B `(Y% of A)` (no more "A vs B" column);
     RERA row shows penetration % in brand gold `#e0b00d`. Also a **year-wise % difference** line chart
     (`diffLine`, zero-baseline) and a **Compare Analysis Report** button.
5. **Reports & disclaimers**:
   - On-screen home report (`buildReport`) deepened: RERA Easy Footprint, Built Form & Density, YoY
     growth row, Market Concentration, and a **Disclaimer** (`DISCLAIMER` / `disclaimerHTML()`).
   - **Compare Analysis Report** (`buildCompareReport`) — detailed two-scope printable report; opens in
     `#reportView` (z-index raised to 1200 so it sits above the master view).
   - Word `.docx` (`build_doc.js`) gained a **Disclaimer & Limitations** section.
   - In-browser reports are **print-to-PDF** only (offline, no libraries); there is no live per-comparison
     .docx (would need a banned external library).

## Recent commits (newest first)
`f2b668f` head-to-head share-of-other + RERA pin inherit · `975277c` head-to-head moved below cards ·
`a433964` pincode scope in master/compare · `8772ce4` .nojekyll · `ee89de6` Current/Maharashtra ticks ·
`26db414` RERA inherits place · `705254c` cascading pickers · `e7d0e2b` RERA % + deeper reports ·
`340d81f` compare + reports + disclaimers · `99f3043` master card upgrades · `c84040f` data refresh +
pincode fix · `994cb89`/`127c05d` mobile.

## Open items for next session
1. Overwrite the stored raw `data/…Raw Data.xlsx` with the new export once Excel is closed, then rebuild.
2. Get GitHub Pages to serve the current build (Settings→Pages / Actions tab; hard-refresh / cache-buster).
3. Verify the latest UI in a browser if possible (the chrome-devtools automation profile has been locked
   by an already-running Chrome this whole time — visual checks were done by the user).
