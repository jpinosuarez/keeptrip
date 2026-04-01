import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { COLORS } from '@shared/config';
import { styles } from './Footer.styles';
import './Footer.css';

const Footer = () => {
  const { t, i18n } = useTranslation('landing');
  const { isMobile } = useWindowSize();

  const languageOptions = [
    { code: 'es', title: 'ES', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'en', title: 'EN', flagUrl: 'https://flagcdn.com/us.svg' },
  ];

  const handleChangeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: t('footer.terms'), href: '#terms' },
    { label: t('footer.privacy'), href: '#privacy' },
    { label: t('footer.contact'), href: '#contact' },
  ];

  return (
    <footer style={styles.footerContainer}>
      <div style={styles.footerWrapper}>
        {/* Brand and Links Row */}
        <div style={styles.footerTop(isMobile)}>
          <div style={styles.footerBrand()}>
            Keeptrip
          </div>
          <nav style={styles.footerLinks(isMobile)} aria-label="Footer navigation">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                style={styles.footerLink}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Semantic Divider */}
        <hr style={styles.footerDivider} aria-hidden="true" />

        {/* Copyright */}
        <div style={styles.footerBottom(isMobile)}>
          <p style={styles.copyrightText}>
            © {currentYear} Keeptrip. {t('footer.copyright')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{t('footer.language')}</span>
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleChangeLanguage(lang.code)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: i18n.language === lang.code ? `2px solid ${COLORS.atomicTangerine}` : '1px solid rgba(0,0,0,0.1)',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={lang.title}
                title={lang.title}
              >
                <img
                  src={lang.flagUrl}
                  alt={lang.title}
                  style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
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
