# Maharashtra School Facilities Dashboard — PGI 2.0 & PGI-D

Static dashboard for Maharashtra schools (UDISE+ AY 2026-27, 108,095 schools). It scores schools, blocks and districts on the District PGI-D and State PGI 2.0 facility indicators. It includes filters, district/block drilldown, target-school lists with CSV export, and school search with profiles.

This is a modular version of the original single file `Maharashtra_PGI_Dashboard (6).html`. The UI, logic and data are unchanged.

## Folder structure

```
index.html                 Page markup (entry point)
css/styles.css             All styles
js/app.js                  Entry: loads data, starts dashboard
js/data.js                 Fetches data/*.json and rebuilds the dataset
js/dashboard.js            Filters, scoring, drilldown, target panel, export, search, profile
js/indicators.js           PGI-D and PGI 2.0 indicator definitions and bit maps
js/utils.js                Formatting helpers
data/manifest.json         Lists the data files and expected school count
data/lookups.json          Districts, blocks, management, school type, gender, locality lists
data/schools-part-01..04.json  School rows (split to keep files small)
assets/logo.png            Header emblem
.nojekyll                  Tells GitHub Pages to serve files as-is
```

## Run locally

The dashboard loads JSON with `fetch()`, so browsers block it when you double-click `index.html` (`file://`). Use a local web server instead:

```bash
cd Maharashtra_PGI_Dashboard
python -m http.server 8000
```

Then open http://localhost:8000/. (Alternatives: `npx serve`, or VS Code "Live Server".)

## Upload to GitHub

1. Create a new repository on GitHub (for example `Maharashtra_PGI_Dashboard`).
2. Upload the **contents** of this folder so that `index.html` sits at the repository root. Use "Add file → Upload files" in the browser, or:
   ```bash
   git init
   git add .
   git commit -m "Maharashtra PGI dashboard"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY-NAME.git
   git push -u origin main
   ```
   Note: the browser uploader can skip hidden files like `.nojekyll`. The site still works without it.

## Enable GitHub Pages

Repository → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save. The first deployment takes 1–2 minutes.

Site URL: https://data2win.github.io/mh_vsk/

All paths are relative, so the site works under this subpath.

## Data notes

- School rows are stored as compact arrays: `[udise, name, distIdx, blockIdx, mgmtIdx, typeIdx, met, has5, met2, genderIdx, locIdx, locality]`. `met` and `met2` are bit fields decoded with the maps in `js/indicators.js`.
- The four part files are concatenated in the order listed in `manifest.json`. Row order is preserved, which matters for search result order.
- To update the data, replace the part files and `lookups.json`, then update `schoolParts` and `totalSchools` in `manifest.json`. The loader throws an error if the row count does not match.
- The repository is public if you use free GitHub Pages. The data includes school names and UDISE codes, so check that it is fine to publish.
- Fonts come from Google Fonts; all other files are local.
