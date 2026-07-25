import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

const Footer = () => {
  const { t, i18n } = useTranslation('landing');

  const languageOptions = [
    { code: 'es', title: 'ES', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'en', title: 'EN', flagUrl: 'https://flagcdn.com/us.svg' },
  ];

  const handleChangeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: t('footer.terms'), href: '/legal#terms' },
    { label: t('footer.privacy'), href: '/legal#privacy' },
    { label: t('footer.contact'), href: '#contact' },
  ];

  return (
    <footer className="relative z-[5] w-full bg-charcoalBlue text-text-secondary px-6 md:px-12 py-20 mt-[140px] border-t border-border/15">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Brand and Links Row */}
        <div className="flex flex-col md:flex-row items-center justify-between flex-wrap gap-8">
          <div className="text-[clamp(1.2rem,2vw,1.8rem)] font-black text-white tracking-[-1px] font-heading cursor-pointer transition-all">
            Keeptrip
          </div>
          <nav className="flex flex-wrap justify-start md:justify-center items-center gap-4 md:gap-8" aria-label="Footer navigation">
            {footerLinks.map((link, index) => (
              link.href.startsWith('/') ? (
                <Link
                  key={index}
                  to={link.href}
                  className="text-[0.95rem] font-medium text-text-secondary no-underline font-body transition-all cursor-pointer px-2 py-1 rounded min-h-[44px] flex items-center hover:text-atomicTangerine hover:bg-atomicTangerine/10"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={index}
                  href={link.href}
                  className="text-[0.95rem] font-medium text-text-secondary no-underline font-body transition-all cursor-pointer px-2 py-1 rounded min-h-[44px] flex items-center hover:text-atomicTangerine hover:bg-atomicTangerine/10"
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>
        </div>

        {/* Semantic Divider */}
        <hr className="m-0 border-none h-px bg-border/30 my-4" aria-hidden="true" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between flex-wrap gap-4 pt-4">
          <p className="m-0 text-[clamp(0.75rem,1vw,0.95rem)] text-text-secondary font-normal font-body leading-[1.5]">
            © {currentYear} Keeptrip. {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span className="text-[0.75rem] text-[#64748b]">{t('footer.language')}</span>
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleChangeLanguage(lang.code)}
                className={cn(
                  "w-11 h-11 rounded-full bg-white flex items-center justify-center cursor-pointer p-0 transition-all border",
                  i18n.language === lang.code ? "border-2 border-atomicTangerine" : "border-black/10"
                )}
                aria-label={lang.title}
                title={lang.title}
              >
                <img
                  src={lang.flagUrl}
                  alt={lang.title}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
