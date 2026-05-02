import React from 'react';
import { useTranslation } from 'react-i18next';

const VisorStorySection = ({ stops, text }) => {
  const { t } = useTranslation();
  const hasPerStopStory = stops.some((stop) => stop.story && stop.story.trim());
  if (hasPerStopStory) return null;

  return (
    <>
      <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal mb-4 font-extrabold">{t('visor.story.title', 'Historia')}</h3>
      <p className="text-[1.1rem] leading-[1.7] text-charcoalBlue whitespace-pre-wrap">{text || t('visor.story.empty', 'Sin relato aun...')}</p>
    </>
  );
};

export default VisorStorySection;
