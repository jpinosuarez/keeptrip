import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { Sparkles } from 'lucide-react';

const EdicionNotesSection = ({ t, texto, onChange, isBusy }) => {
  const handleFieldFocus = (e) => {
    const target = e.currentTarget;
    setTimeout(() => {
      if (target && document.activeElement === target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 280);
  };

  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <Sparkles size={15} className="text-[#FF6B35]" /> {t('labels.notas', 'Notas')}
        <InfoTooltip textKey="editor:tooltip.relato" size={13} />
      </h3>
      <textarea
        value={texto || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFieldFocus}
        className="w-full min-h-[120px] border border-border rounded-sm p-3.5 text-base text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine resize-y"
        placeholder={t('labels.notesPlaceholder')}
        maxLength={5000}
        disabled={isBusy}
      />
    </div>
  );
};

export default EdicionNotesSection;

