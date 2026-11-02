import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Zero-slop trip story: renders only when there is real text to show.
 * (Sections are omitted entirely when empty — never a placeholder.)
 */
const VisorStorySection = ({ stops = [], text = '' }) => {
  const { t } = useTranslation('visor');
  const hasPerStopStory = (stops || []).some((stop) => stop?.relato && stop.relato.trim());
  const hasText = typeof text === 'string' && text.trim().length > 0;

  if (hasPerStopStory || !hasText) return null;

  return (
    <>
      <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal mb-4 font-extrabold">
        {t('story.title', 'Historia')}
      </h3>
      <p className="text-[1.1rem] leading-[1.7] text-charcoalBlue whitespace-pre-wrap">{text}</p>
    </>
  );
};

export default VisorStorySection;
