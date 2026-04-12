@workspace Here is the Master Specification for the "Dynamic Title Generation" (Auto-Title) feature in the Trip Editor. Read this carefully. Any modification to `useEdicionModalLifecycle`, `EditableTripHeader`, or the title state MUST strictly adhere to these rules.

### 🎯 1. The Core Philosophy
The Auto-Title is a reactive engine designed to reduce cognitive load by naming the trip automatically based on its stops. However, **User Intent is Supreme**: The moment a user manually edits the title, the machine must step back and respect their input permanently, until explicitly told otherwise.

### ⚙️ 2. The State Machine (When it updates)
The feature is governed by a strict 5-rule State Machine, controlled by the `isTituloAuto` boolean flag:

1. **Hydration (Existing Trip):**
   - *Condition:* Modal opens with data from Firestore (trip has an ID and a saved title).
   - *Action:* Populate the `<textarea>` with the saved title. Set `isTituloAuto = false`.
   - *Constraint:* The auto-engine MUST NOT overwrite this title during the initial render. Use an identity check (`viaje.id === formData.id`) or a `hasHydrated` ref to block premature execution.

2. **Hydration (Brand New Trip):**
   - *Condition:* Modal opens for a new trip (coming from the Search Modal with an initial selected destination).
   - *Action:* Set `isTituloAuto = true`. Immediately generate the initial title based on that first inherited stop (e.g., "Viaje a [City]").

3. **The Reactive Engine (Adding/Removing Stops):**
   - *Condition:* User adds or deletes a stop AND `isTituloAuto === true`.
   - *Action:* The title recalculates instantly. The `useEffect` governing this MUST have `paradas` in its dependency array and must explicitly check `if (!isTituloAuto) return;`.

4. **The Manual Override (User types):**
   - *Condition:* The user clicks the title input and types/deletes ANY character.
   - *Action:* Instantly set `isTituloAuto = false`. The Reactive Engine goes to sleep. The UI shows exactly what the user typed.

5. **The Recovery (Regenerate Button):**
   - *Condition:* `isTituloAuto === false`.
   - *Action:* Display a "✨ Regenerar" button. Clicking it sets `isTituloAuto = true` and immediately forces the Reactive Engine to recalculate based on current `paradas`.

### 🌍 3. The Formatting Logic (What it says)
Hardcoded strings are STRICTLY FORBIDDEN. All titles must pass through the `i18n` translation layer. The generator must analyze the array of `paradas` and apply this specific logic:

- **0 Stops (Fallback):**
  - *Key:* `t('editor.autoTitle.empty')` -> "Borrador de viaje" / "Trip draft".
- **1 Stop:**
  - *Logic:* Extract the City.
  - *Key:* `t('editor.autoTitle.single', { city: cityName })` -> "Viaje a {city}".
- **2 Stops (Same Country):**
  - *Logic:* Extract both Cities.
  - *Key:* `t('editor.autoTitle.twoCities', { city1, city2 })` -> "Viaje a {city1} y {city2}".
- **2 Stops (Different Countries):**
  - *Logic:* Extract both Countries.
  - *Key:* `t('editor.autoTitle.twoCountries', { country1, country2 })` -> "Viaje por {country1} y {country2}".
- **3+ Stops (Same Country):**
  - *Logic:* If there are 3 or more cities but they all share the SAME country, group them.
  - *Key:* `t('editor.autoTitle.countryTour', { country: countryName })` -> "Gran tour por {country}".
- **3 Stops (Different Countries):**
  - *Logic:* Extract unique countries. Use `new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format([C1, C2, C3])`.
  - *Key:* `t('editor.autoTitle.multiCountry', { countries: formattedList })` -> "Aventura por {countries}".
- **4+ Stops (Different Countries - Edge Case):**
  - *Logic:* Extract the first two unique countries.
  - *Key:* `t('editor.autoTitle.expedition', { country1, country2 })` -> "Expedición por {country1}, {country2} y más destinos".

### 🛑 4. Technical Guardrails
- **Pure Functions:** The title generation logic (`generarTituloInteligente`) must be a pure, testable utility function decoupled from React components. It should accept `(paradas, t, language)` as arguments.
- **Native Lists:** Always use `Intl.ListFormat` for lists to respect grammatical rules in different languages.

Please implement the formatting logic and translation keys exactly as described above.