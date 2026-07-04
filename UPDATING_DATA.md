# Updating the data — how to load a new export

This project turns **one MahaRERA Excel export** into three deliverables (interactive dashboard,
Word report, developer mailer). To refresh with newer data, you **replace the Excel file and
re-run the build scripts** — there is no upload button; everything runs locally and offline.

The pipeline is **dataset-agnostic**: all counts and year references (project total, footer year
range, "launch backlog / year-to-date" notes, momentum window) are derived from the data. As long
as the new file has the **same 21 columns in the same order**, no code edits are needed.

---

## 1. Requirements (one-time)

- **Python 3** with `openpyxl` → `pip install openpyxl`
- **Node.js** with the `docx` package → `npm install docx` (creates `node_modules/`)

## 2. Drop in the new export

Pick ONE:

- **Replace in place** — overwrite `data/Project RERA stats - Raw Data.xlsx` with the new file
  (same name). The sheet can be named anything (first sheet is used if there's no `Sheet1`).
- **Keep a new filename** — leave your file in `data/` and pass its path to `prep.py` in step 3,
  e.g. `data/Q3 2026 export.xlsx`.

## 3. Run the four builds (from the project root, in order)

```bash
python src/prep.py                 # Excel  -> data/data.json   (clean + encode)
python src/build_stats.py          # data.json -> data/stats.json (aggregates + year metadata)
python src/build_dashboard.py      # -> RERA Market Analysis Dashboard.html
node   src/build_doc.js            # -> RERA Easy - Maharashtra Market Analysis.docx
```

If you kept a different filename, only the first line changes:

```bash
python src/prep.py "data/Q3 2026 export.xlsx"
```

(On Windows, if `python` is not found, use `py` instead.)

## 4. Open the refreshed deliverables (project root)

- `RERA Market Analysis Dashboard.html` — open in any browser (offline, self-contained).
- `RERA Easy - Maharashtra Market Analysis.docx` — open in Word.

That's it. The dashboard's footer count, year range, trend/report notes and momentum window all
recompute from the new data automatically.

---

## Required column layout (must match, same order)

`prep.py` reads by **column position**, so the new export must keep these 21 columns in order:

| # | Column | # | Column |
|---|--------|---|--------|
| 0 | Unique ID | 11 | Village |
| 1 | Registration Date | 12 | Pin Code |
| 2 | Project Type | 13 | # of Units |
| 3 | Project Status | 14 | Land Area |
| 4 | Project Current Status | 15 | Carpet Area |
| 5 | Proposed Date of Completion | 16 | Built Up Area (Sanctioned FSI) |
| 6 | Average Days to complete the project | 17 | Permissible FSI |
| 7 | State | 18 | # of Complaints |
| 8 | Division | 19 | Bank Name |
| 9 | District | 20 | RERA Easy Clientele (Yes/No) |
| 10 | Taluka | | |

## Data cleaning applied automatically (in `prep.py`)

- Rows with **impossible carpet / land / built-up** values are **deleted** (value > 2,000,000 sq.m,
  or > 2,000 sq.m per unit — data-entry errors). This is why the project count is slightly below
  the raw row count.
- Negative "average days to complete" is treated as missing for that metric only.

## What updates automatically vs. manually

- **Auto:** dashboard + Word report — counts, year range, footer, launch/YTD notes, momentum.
- **Manual:** `RERA Easy - Developer Market Snapshot.html` (developer mailer) has **baked-in
  numbers**. Edit `src/developer_snapshot.html` if you need to send it with refreshed figures.

## Quick sanity check

- The `#errbar` strip at the top of the dashboard stays hidden (no red error bar).
- `prep.py` prints the project count; the KPI "Projects" tile and footer should match it.
- The footer year range reflects the min–max registration years in the new file.

## Troubleshooting

- **`Python was not found`** on Windows → use `py` instead of `python`.
- **Columns changed / re-ordered** → `prep.py`'s index mapping (`r[1]`, `r[2]`, …) must be updated
  to match. Send the new header row and this can be remapped quickly.
- **Blank dashboard / red error bar** → re-run `python src/build_dashboard.py` and reopen; check
  that `data/data.json` was regenerated.
