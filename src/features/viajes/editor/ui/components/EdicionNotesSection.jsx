import React, { useState } from 'react';
import { Sparkles, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

const EdicionNotesSection = ({ t, formData, setFormData, texto, onChange, isBusy }) => {
  const value = formData?.texto ?? texto ?? '';
  const [showStory, setShowStory] = useState(Boolean(value && String(value).trim()));

  const setTexto = (val) => {
    if (typeof setFormData === 'function') setFormData((prev) => ({ ...prev, texto: val }));
    else onChange?.(val);
  };
  const setTitular = (val) => {
    if (typeof setFormData === 'function') setFormData((prev) => ({ ...prev, titular: val }));
  };

  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Sparkles size={15} className="text-[#FF6B35]" /> {t('details.tripHeadlineLabel', 'Frase o Titular del Viaje')}
      </h3>

      <input
        type="text"
        value={formData?.titular || ''}
        onChange={(e) => setTitular(e.target.value)}
        maxLength={200}
        placeholder={t('details.tripHeadlinePlaceholder', 'En una frase: ¿cómo recordarás esta aventura? (Ej: Diez días mágicos recorriendo castillos)')}
        className="w-full border border-border rounded-lg px-3.5 py-2.5 text-[0.9rem] text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine"
        disabled={isBusy}
      />

      <button
        type="button"
        onClick={() => setShowStory((v) => !v)}
        className="self-start mt-1 inline-flex items-center gap-1.5 text-[0.78rem] font-bold text-mutedTeal bg-transparent border-none cursor-pointer hover:text-[#FF6B35] transition-colors"
        aria-expanded={showStory}
      >
        {showStory ? <ChevronDown size={14} className="rotate-180" /> : <Plus size={14} />}
        {t('details.extendedStoryToggle', 'Escribir relato o prólogo extendido')}
      </button>

      {showStory && (
        <textarea
          value={value || ''}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full min-h-[120px] border border-border rounded-lg p-3.5 text-base text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine resize-y"
          placeholder={t('labels.notesPlaceholder', '¿Qué quieres recordar de este viaje?')}
          maxLength={5000}
          disabled={isBusy}
        />
      )}
    </div>
  );
};

export default EdicionNotesSection;
