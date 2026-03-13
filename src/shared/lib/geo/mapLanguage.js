/**
 * Sets the language of Mapbox GL JS label layers to match the app locale.
 * Works with Mapbox styles that have `name_XX` properties (e.g. light-v11).
 *
 * @param {import('mapbox-gl').Map} map - Mapbox GL map instance
 * @param {string} lang - Language code ('es' | 'en')
 */
export function setMapLanguage(map, lang) {
  const mapInstance = typeof map.getMap === 'function' ? map.getMap() : map;
  const field = lang === 'en' ? 'name_en' : 'name_es';
  const style = mapInstance.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;
    const textField = layer.layout?.['text-field'];
    if (!textField) continue;
    // Only change layers that reference a name* property
    const serialized = JSON.stringify(textField);
    if (serialized.includes('name')) {
      mapInstance.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', field], ['get', 'name']]);
    }
  }
}
