import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
const WelcomeBento = ({ name, isNewTraveler, onNewTrip }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="relative w-full h-full flex flex-col justify-between gap-2 md:gap-3 p-4 md:p-5">
      <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden" aria-hidden="true">
        <span className="absolute w-[140px] h-[140px] -right-11 -top-14 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.16)_0%,rgba(255,107,53,0)_72%)]" />
        <span className="absolute w-[120px] h-[120px] -left-10 -bottom-[60px] rounded-full bg-[radial-gradient(circle,rgba(69,176,168,0.14)_0%,rgba(69,176,168,0)_74%)]" />
      </div>
      <div className="relative z-[1] flex flex-col gap-2">
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 text-[clamp(1.25rem,2.2vw,1.6rem)] font-black text-charcoalBlue leading-[1.18] tracking-tight font-heading">{t('greeting', { name })}</h1>
          {isNewTraveler ? (
            /* ── Aspirational Empty State: Premium editorial magazine feel ── */
            <Motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-start gap-2.5 mt-0.5"
            >
              <p className="m-0 text-[clamp(0.95rem,1.5vw,1.08rem)] font-semibold text-text-secondary leading-normal tracking-tight italic max-w-[380px] font-body">
                {t('welcome.aspirationalMessage')}
              </p>
              <Motion.button
                type="button"
                onClick={onNewTrip}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-atomicTangerine to-orange-400 text-white border-none rounded-full text-[0.82rem] font-extrabold cursor-pointer shadow-[0_6px_20px_theme(colors.atomicTangerine/0.35)] min-h-[44px] w-fit tracking-wide font-heading"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Compass size={16} />
                {t('welcome.aspirationalCtaLabel')}
              </Motion.button>
            </Motion.div>
          ) : (
            /* ── Returning Traveler: Clean subtitle, no gamification clutter ── */
            <p className="m-0 mt-0 text-[clamp(0.88rem,0.98vw,0.95rem)] font-medium text-text-secondary leading-relaxed font-body">{t('welcomeSubtitle')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeBento;