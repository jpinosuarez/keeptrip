import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles, Heart, Home } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { getCountryFlagEmoji } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

const WelcomeBento = ({ name, isNewTraveler, onNewTrip }) => {
  const { t, i18n } = useTranslation('dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAuth() || {};

  const birthCountry = userProfile?.birthCountry;
  const residenceCountry = userProfile?.residenceCountry;
  const baseCity = userProfile?.baseCity;
  const hasCompletedOnboarding = userProfile?.hasCompletedOnboarding;

  const birthName = birthCountry ? getLocalizedCountryName(birthCountry, i18n.language) : '';
  const residenceName = residenceCountry ? getLocalizedCountryName(residenceCountry, i18n.language) : '';

  const handleOpenOnboarding = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('onboarding', 'true');
      return next;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between gap-2 md:gap-3 p-4 md:p-5">
      <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden" aria-hidden="true">
        <span className="absolute w-[140px] h-[140px] -right-11 -top-14 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.16)_0%,rgba(255,107,53,0)_72%)]" />
        <span className="absolute w-[120px] h-[120px] -left-10 -bottom-[60px] rounded-full bg-[radial-gradient(circle,rgba(69,176,168,0.14)_0%,rgba(69,176,168,0)_74%)]" />
      </div>
      <div className="relative z-[1] flex flex-col gap-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="m-0 text-[clamp(1.25rem,2.2vw,1.6rem)] font-black text-charcoalBlue leading-[1.18] tracking-tight font-heading">
              {t('greeting', { name })}
            </h1>

            {/* Geographic Identity Pills */}
            {(birthCountry || residenceCountry) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {birthCountry === residenceCountry ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#45B0A8]/10 text-[#45B0A8] border border-[#45B0A8]/20 text-xs font-bold font-heading">
                    <Home size={12} />
                    <span>{getCountryFlagEmoji(birthCountry)}</span>
                    <span>{baseCity?.name ? `${baseCity.name}, ` : ''}{birthName}</span>
                  </span>
                ) : (
                  <>
                    {birthCountry && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2C3E50]/10 text-[#2C3E50] border border-[#2C3E50]/20 text-xs font-bold font-heading">
                        <Heart size={11} className="text-[#FF6B35]" />
                        <span>{getCountryFlagEmoji(birthCountry)}</span>
                        <span>{birthName}</span>
                      </span>
                    )}
                    {residenceCountry && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#45B0A8]/10 text-[#45B0A8] border border-[#45B0A8]/20 text-xs font-bold font-heading">
                        <Home size={11} />
                        <span>{getCountryFlagEmoji(residenceCountry)}</span>
                        <span>{baseCity?.name ? `${baseCity.name}, ` : ''}{residenceName}</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Interactive Boost Pill if onboarding is not completed */}
            {!hasCompletedOnboarding && (
              <button
                type="button"
                onClick={handleOpenOnboarding}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF6B35]/15 to-[#FF6B35]/5 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-black hover:bg-[#FF6B35]/25 transition-all cursor-pointer font-heading min-h-[36px]"
              >
                <Sparkles size={13} className="animate-pulse" />
                <span>{t('onboarding.setupRootsCta', '✨ Configurar mis raíces y base (+50 XP)')}</span>
              </button>
            )}
          </div>
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