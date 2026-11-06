import React from 'react';
import { Sparkles, Utensils, Eye, Lightbulb, Plus } from 'lucide-react';

const EdicionHighlightsSection = ({ t, formData, setFormData, paradas = [] }) => {
  const setField = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      highlights: { ...(prev.highlights || {}), [field]: value },
    }));

  const collectLugares = (categories) => {
    const names = [];
    (Array.isArray(paradas) ? paradas : []).forEach((p) => {
      (Array.isArray(p?.lugares) ? p.lugares : []).forEach((l) => {
        if (l?.nombre && categories.includes(l.categoria)) names.push(l.nombre);
      });
    });
    return [...new Set(names)];
  };

  const foodSuggestions = collectLugares(['gastronomia']);
  const viewSuggestions = collectLugares(['mirador', 'monumento']);

  const inputClasses =
    'w-full border border-border rounded-lg px-3.5 py-2.5 text-[0.9rem] text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine';

  const fields = [
    { key: 'topFood', label: t('details.topFoodLabel', 'El Mejor Sabor'), placeholder: t('details.topFoodPlaceholder', 'Plato, café o restaurante inolvidable'), Icon: Utensils, suggestions: foodSuggestions },
    { key: 'topView', label: t('details.topViewLabel', 'La Mejor Postal'), placeholder: t('details.topViewPlaceholder', 'Mirador, monumento o paisaje que te dejó sin aliento'), Icon: Eye, suggestions: viewSuggestions },
    { key: 'topTip', label: t('details.topTipLabel', 'El Momento Inolvidable'), placeholder: t('details.topTipPlaceholder', 'La anécdota, experiencia o consejo estrella'), Icon: Lightbulb, suggestions: [] },
  ];

  return (
    <div className="flex flex-col gap-3 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Sparkles size={15} className="text-[#FF6B35]" /> {t('details.trilogyTitle', 'La Trilogía del Viaje')}
      </h3>

      {fields.map(({ key, label, placeholder, Icon, suggestions }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[0.75rem] font-bold text-slate-600">
            <Icon size={13} className="text-[#FF6B35]" /> {label}
          </label>
          <input
            placeholder={placeholder}
            value={formData.highlights?.[key] || ''}
            onChange={(e) => setField(key, e.target.value)}
            maxLength={200}
            className={inputClasses}
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              <span className="text-[0.66rem] font-bold uppercase tracking-wider text-slate-400 self-center">
                {t('details.fromYourStops', 'De tus paradas')}:
              </span>
              {suggestions.slice(0, 6).map((nombre) => (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => setField(key, nombre)}
                  className="inline-flex items-center gap-1 rounded-full bg-mutedTeal/10 text-mutedTeal border border-mutedTeal/25 px-2 py-0.5 text-[0.72rem] font-bold"
                >
                  <Plus size={11} /> {nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EdicionHighlightsSection;
