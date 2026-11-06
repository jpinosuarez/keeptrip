import React, { useState } from 'react';
import { Users, X, Plus, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

const COMPANION_TYPES = [
  ['solo', '🎒', 'Solo'],
  ['couple', '💑', 'Pareja'],
  ['family', '👨‍👩‍👧‍👦', 'Familia'],
  ['friends', '🍻', 'Amigos'],
];

const STYLE_OPTIONS = [
  { label: '🎒 Mochilero', legacy: ['Mochilero', 'mochilero'] },
  { label: '🏖️ Relax y Playa', legacy: ['Relax', 'relax'] },
  { label: '🥾 Naturaleza', legacy: ['Naturaleza', 'naturaleza', 'Aventura', 'aventura'] },
  { label: '🏛️ Cultural', legacy: ['Cultural', 'cultural'] },
  { label: '🍷 Gastronómico', legacy: ['Gastronómico', 'gastronomico'] },
  { label: '🚗 Roadtrip', legacy: ['Roadtrip', 'roadtrip'] },
  { label: '📸 Fotográfico', legacy: ['Fotográfico', 'fotografico'] },
  { label: '❄️ Invierno', legacy: ['Invierno', 'invierno'] },
];

const EdicionContextSection = ({
  t,
  formData,
  setFormData,
  showCompanions = true,
  frequentCompanions = [],
  companionDraft,
  companionResults,
  onCompanionSearch,
  onAddCompanionFreeform,
  onAddCompanionFromResult,
}) => {
  const [showCustomStyle, setShowCustomStyle] = useState(false);
  const [customText, setCustomText] = useState('');

  const vibe = Array.isArray(formData.vibe) ? formData.vibe : [];
  const companions = Array.isArray(formData.companions) ? formData.companions : [];
  const isSolo = formData.companionType === 'solo';

  const isStyleActive = (opt) =>
    vibe.includes(opt.label) || opt.legacy.some((l) => vibe.includes(l));

  const toggleStyle = (opt) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.vibe) ? prev.vibe : [];
      const active = current.includes(opt.label) || opt.legacy.some((l) => current.includes(l));
      if (active) {
        return { ...prev, vibe: current.filter((v) => v !== opt.label && !opt.legacy.includes(v)) };
      }
      return { ...prev, vibe: [...current, opt.label] };
    });
  };

  const addCustomStyle = () => {
    const text = customText.trim();
    if (!text) return;
    setFormData((prev) => ({ ...prev, vibe: [...(prev.vibe || []), text] }));
    setCustomText('');
    setShowCustomStyle(false);
  };

  const extraVibes = vibe.filter(
    (v) => !STYLE_OPTIONS.some((o) => o.label === v || o.legacy.includes(v))
  );

  const companionNames = new Set(
    companions.map((c) => (typeof c === 'string' ? c : c?.name || c?.email || '')).filter(Boolean)
  );
  const suggestions = (frequentCompanions || []).filter(
    (name) => name && !companionNames.has(name)
  );

  const addFrequentCompanion = (name) => {
    setFormData((prev) => ({ ...prev, companions: [...(prev.companions || []), name] }));
  };

  const addCompanion = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, companions: [...(prev.companions || []), trimmed] }));
  };

  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
        <Users size={15} className="text-[#FF6B35]" /> {t('details.withWhom', '¿Con quién viajaste?')}
      </h3>

      {/* Companion type pills */}
      <div className="flex gap-2 flex-wrap mb-2">
        {COMPANION_TYPES.map(([value, emoji, fallback]) => {
          const selected = (formData.companionType || '') === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() =>
                setFormData((prev) => {
                  const next = prev.companionType === value ? null : value;
                  return { ...prev, companionType: next, companions: next === 'solo' ? [] : (prev.companions || []) };
                })
              }
              aria-pressed={selected}
              className={cn(
                'min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[0.875rem] transition-all duration-200 cursor-pointer',
                selected
                  ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine font-bold'
                  : 'border-border bg-surface text-textPrimary font-normal'
              )}
            >
              <span aria-hidden="true">{emoji}</span>
              {t(`companionType.${value}`, fallback)}
            </button>
          );
        })}
      </div>

      {/* Companion names — progressive disclosure (hidden for solo) */}
      {showCompanions && !isSolo && (
        <div className="mb-3">
          <div className="flex gap-2 items-center">
            <input
              placeholder={t('labels.nameOrEmail', 'Nombre o email')}
              value={companionDraft || ''}
              onChange={(e) => onCompanionSearch?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCompanion(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              maxLength={100}
              className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-border text-[0.875rem] outline-none bg-background focus:border-atomicTangerine"
            />
            <button
              type="button"
              onClick={() => addCompanion(companionDraft)}
              disabled={!companionDraft?.trim()}
              className="min-h-[44px] bg-surface border border-border rounded-lg px-3.5 py-2 text-[0.875rem] font-bold text-textPrimary cursor-pointer transition-all hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('labels.addCompanion', 'Agregar')}
            </button>
          </div>

          {companionResults?.length > 0 && (
            <div className="border border-border rounded-lg mt-2 max-h-[160px] overflow-y-auto bg-surface">
              {companionResults.map((u) => (
                <div
                  key={u.uid}
                  className="p-2 px-3 flex justify-between items-center cursor-pointer gap-2 hover:bg-background transition-colors"
                  onClick={() => onAddCompanionFromResult?.(u)}
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <strong className="block text-[0.875rem] truncate">{u.displayName || u.email}</strong>
                    <div className="text-xs text-textSecondary truncate">{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                {t('details.frequentCompanionsTitle', 'Compañeros frecuentes')}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {suggestions.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addFrequentCompanion(name)}
                    className="min-h-[36px] inline-flex items-center gap-1 rounded-full bg-[#45B0A8]/10 text-[#2C3E50] border border-[#45B0A8]/30 px-2.5 py-1 text-[0.75rem] font-bold hover:bg-[#45B0A8]/20"
                  >
                    <Plus size={12} /> {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {companions.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {companions.map((c, idx) => {
                const name = typeof c === 'string' ? c : c?.name || c?.email || '';
                return (
                  <span key={idx} className="px-2.5 py-1.5 rounded-full bg-background border border-border flex gap-1.5 items-center max-w-[200px]">
                    <span className="text-[0.85rem] truncate min-w-0">{name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, companions: prev.companions.filter((_, i) => i !== idx) }))}
                      aria-label={t('labels.removeCompanion', { name })}
                      className="bg-transparent border-none text-textSecondary cursor-pointer flex items-center p-0.5 hover:text-danger"
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trip style */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <Sparkles size={15} className="text-[#FF6B35]" /> {t('details.travelStyleTitle', 'Estilo del Viaje')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map((opt) => {
            const active = isStyleActive(opt);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => toggleStyle(opt)}
                aria-pressed={active}
                className={cn(
                  'min-h-[44px] rounded-full border px-2.5 py-1.5 text-[0.78rem] font-semibold transition-all',
                  active ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]' : 'border-slate-200 bg-white text-slate-600'
                )}
              >
                {opt.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowCustomStyle((v) => !v)}
            className="min-h-[44px] rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-[0.78rem] font-bold text-slate-600"
          >
            + {t('details.addCustomStyle', 'Personalizado')}
          </button>
          {extraVibes.map((tag) => (
            <span key={tag} className="min-h-[44px] inline-flex items-center gap-1 rounded-full border border-[#FF6B35] bg-[#FF6B35]/10 px-2.5 py-1.5 text-[0.78rem] font-bold text-[#FF6B35]">
              {tag}
              <button type="button" onClick={() => setFormData((prev) => ({ ...prev, vibe: prev.vibe.filter((v) => v !== tag) }))} className="bg-transparent border-none p-0 cursor-pointer text-[#FF6B35] flex"><X size={12} /></button>
            </span>
          ))}
        </div>

        {showCustomStyle && (
          <div className="mt-2 flex gap-1.5">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomStyle(); } }}
              maxLength={40}
              placeholder={t('details.customStylePlaceholder', 'Ej: Surf y atardeceres')}
              className="flex-1 min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 text-[0.85rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35]"
            />
            <button type="button" onClick={addCustomStyle} className="min-h-[44px] px-4 rounded-xl bg-[#FF6B35] text-white font-bold text-[0.8rem]">{t('button.add', 'Añadir')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EdicionContextSection;
