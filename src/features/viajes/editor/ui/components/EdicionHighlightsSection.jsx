import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { COLORS, RADIUS } from '@shared/config';

const EdicionHighlightsSection = ({ styles, t, formData, setFormData }) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>
        {t('labels.highlights')} <InfoTooltip textKey="editor:tooltip.highlights" size={13} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input
          placeholder={t('highlightPlaceholders.topFood')}
          value={formData.highlights?.topFood || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              highlights: { ...(prev.highlights || {}), topFood: e.target.value },
            }))
          }
          maxLength={120}
          style={styles.dateInput}
        />
        <input
          placeholder={t('highlightPlaceholders.topView')}
          value={formData.highlights?.topView || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              highlights: { ...(prev.highlights || {}), topView: e.target.value },
            }))
          }
          maxLength={120}
          style={styles.dateInput}
        />
        <input
          placeholder={t('highlightPlaceholders.topTip')}
          value={formData.highlights?.topTip || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              highlights: { ...(prev.highlights || {}), topTip: e.target.value },
            }))
          }
          maxLength={120}
          style={{ ...styles.dateInput, gridColumn: '1 / -1' }}
        />
      </div>
    </div>
  );
};

export default EdicionHighlightsSection;
