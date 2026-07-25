import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';

const EdicionNotesSection = ({ t, texto, onChange, isBusy }) => {
  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <label className="text-[0.78rem] font-extrabold text-textSecondary uppercase tracking-[0.5px] flex items-center gap-1.5">
        {t('labels.notas')} <InfoTooltip textKey="editor:tooltip.relato" size={13} />
      </label>
      <textarea
        value={texto || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[120px] border border-border rounded-sm p-3.5 text-base text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine resize-y"
        placeholder={t('labels.notesPlaceholder')}
        maxLength={5000}
        disabled={isBusy}
      />
    </div>
  );
};

export default EdicionNotesSection;
