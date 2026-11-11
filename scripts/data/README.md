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

## Hybrid resolution (real GIS, no synthetic curves)

`node scripts/build-country-emblems.mjs` now resolves silhouettes in three tiers:

1. **`osm-microstates.json`** — survey-grade terrestrial ADM0 polygons for **MC, VA, SM,
   LI, AD**, vendored from **geoBoundaries `gbOpen`** (boundary source: OpenStreetMap /
   Wambacher), **ODbL 1.0**. Monaco is strictly the land strip
   (`lng 7.409–7.440`, `lat 43.724–43.752`) — never the 12 nm maritime boundary.
2. **`world-atlas-countries-10m.json`** — vendored
   `world-atlas@2/countries-10m.json` (Natural Earth 1:10m, public domain) for
   small/island states and for any country whose 50m silhouette has fewer than 35
   vertices.
3. **`world-atlas-countries-50m.json`** — Natural Earth 1:50m for large/medium
   countries (US keeps its Albers USA composite).

The generator rewinds GeoJSON rings to d3's spherical winding (otherwise `fitExtent`
collapses a microstate to one pixel), applies adaptive Douglas-Peucker (60–250 vertices
for the OSM microstates, ≥35 for 10m islands) and fails the build if MC/VA/SM/LI/AD/MT/TV
contain Bézier `C` commands or fewer than 35 vertices, or if any of the 195 UN sovereigns
falls back to the geometric shield.
