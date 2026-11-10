# Vendored geodata — Country Emblems build source

`world-atlas-countries-110m.json` is a vendored copy of the
[`world-atlas@2`](https://www.npmjs.com/package/world-atlas) `countries-110m.json`
TopoJSON, which is derived from the **Natural Earth 1:110m** dataset.

- **Source:** `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- **Underlying data:** Natural Earth, public domain (CC0 1.0).
- **Purpose:** consumed **only at build time** by
  `scripts/build-country-emblems.mjs` to generate
  `src/features/gamification/model/data/countryEmblemsCatalog.json`.
- **Why vendored:** keeps `npm run build` and `node scripts/build-country-emblems.mjs`
  fully deterministic and offline — the app never fetches geometry at runtime
  (zero network, zero extra Firestore reads, 100% available under Kill-Switch L1–L4).

Each TopoJSON geometry carries the ISO 3166-1 **numeric** country id (e.g. `032` for
Argentina, `724` for Spain). The build script maps those numeric ids to ISO-2 codes using
the already-installed `world-countries` package (`ccn3` → `cca2`).
