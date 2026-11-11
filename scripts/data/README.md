# Vendored geodata — Country Emblems build source

The active build source is `world-atlas-countries-50m.json` — a vendored copy of the
[`world-atlas@2`](https://www.npmjs.com/package/world-atlas) `countries-50m.json`
TopoJSON, derived from the **Natural Earth 1:50m** dataset (high-fidelity silhouettes).

- **Source:** `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json`
- **Underlying data:** Natural Earth, public domain (CC0 1.0).
- **Purpose:** consumed **only at build time** by
  `scripts/build-country-emblems.mjs` to generate
  `src/features/gamification/model/data/countryEmblemsCatalog.json`.
- **Why vendored:** keeps `npm run build` and `node scripts/build-country-emblems.mjs`
  fully deterministic and offline — the app never fetches geometry at runtime
  (zero network, zero extra Firestore reads, 100% available under Kill-Switch L1–L4).
- **Size budget:** the generator applies Douglas-Peucker simplification (planar px
  tolerance) + 1-decimal rounding so the emitted catalog stays under ~500 KB.

`world-atlas-countries-110m.json` is retained for reference/comparison only (not used
by the active pipeline).

Each TopoJSON geometry carries the ISO 3166-1 **numeric** country id (e.g. `032` for
Argentina, `724` for Spain, `242` for Fiji). The build script maps those numeric ids to
ISO-2 codes using the already-installed `world-countries` package (`ccn3` → `cca2`).
