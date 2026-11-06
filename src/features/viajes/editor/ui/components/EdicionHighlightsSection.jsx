import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { Sparkles } from 'lucide-react';

const EdicionHighlightsSection = ({ t, formData, setFormData }) => {
  const inputClasses = "w-full border border-border rounded-sm px-3.5 py-2.5 text-base text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine";

  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <Sparkles size={15} className="text-[#FF6B35]" /> {t('labels.highlights', 'Highlights')}
        <InfoTooltip textKey="editor:tooltip.highlights" size={13} />
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
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
          className={inputClasses}
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
          className={inputClasses}
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
          className={`${inputClasses} col-span-2`}
        />
      </div>
    </div>
  );
};

export default EdicionHighlightsSection;
