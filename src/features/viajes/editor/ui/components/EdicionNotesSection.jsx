import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';

const EdicionNotesSection = ({ styles, t, texto, onChange, isBusy }) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>
        {t('labels.notas')} <InfoTooltip textKey="editor:tooltip.relato" size={13} />
      </label>
      <textarea
        value={texto || ''}
        onChange={(e) => onChange(e.target.value)}
        style={styles.textarea}
        placeholder={t('labels.notesPlaceholder')}
        disabled={isBusy}
      />
    </div>
  );
};

export default EdicionNotesSection;
