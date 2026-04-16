import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS, FONTS, SHADOWS, SPACING, RADIUS } from '@shared/config';
import LegalDocumentViewer from '@shared/ui/legal/LegalDocumentViewer';
import legalES from '../../../i18n/locales/es/legal.json';

const TABS = [
  { key: 'privacy', label: legalES.ui.tabs.privacy },
  { key: 'terms', label: legalES.ui.tabs.terms },
  { key: 'cookies', label: legalES.ui.tabs.cookies },
];

const normalizeHashToDoc = (hash) => {
  if (!hash) return 'privacy';
  const clean = hash.replace('#', '').trim().toLowerCase();
  if (clean === 'terms') return 'terms';
  if (clean === 'cookies') return 'cookies';
  return 'privacy';
};

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeDoc = useMemo(() => normalizeHashToDoc(location.hash), [location.hash]);

  const handleSwitchDoc = (docKey) => {
    navigate(`/legal#${docKey}`, { replace: true });
  };

  return (
    <main
      style={{
        height: '100dvh',
        background: COLORS.background,
        padding: `${SPACING.lg} ${SPACING.md} ${SPACING['2xl']}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '920px',
          margin: '0 auto',
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOWS.md,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: `${SPACING.xl} ${SPACING.lg} ${SPACING.md}`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: COLORS.textPrimary,
              fontFamily: FONTS.heading,
              fontSize: 'clamp(1.6rem, 2.3vw, 2rem)',
              lineHeight: 1.2,
            }}
          >
            {legalES.ui.title}
          </h1>
          <p
            style={{
              margin: `${SPACING.sm} 0 0`,
              color: COLORS.textTertiary,
              fontFamily: FONTS.body,
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            {legalES.ui.subtitle}
          </p>
        </header>

        <nav
          aria-label="Selector de documentos legales"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 3,
            display: 'flex',
            gap: SPACING.sm,
            overflowX: 'auto',
            padding: `${SPACING.md} ${SPACING.lg}`,
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeDoc === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSwitchDoc(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  minHeight: '44px',
                  padding: `0 ${SPACING.md}`,
                  borderRadius: RADIUS.full,
                  border: isActive ? 'none' : `1px solid ${COLORS.border}`,
                  background: isActive
                    ? `linear-gradient(135deg, ${COLORS.atomicTangerine}, #ff9154)`
                    : COLORS.surface,
                  color: isActive ? COLORS.surface : COLORS.textPrimary,
                  fontFamily: FONTS.body,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? `0 6px 18px ${COLORS.atomicTangerine}40` : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            paddingTop: SPACING.lg,
            minHeight: 0,
            flex: 1,
            display: 'flex',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <LegalDocumentViewer docType={activeDoc} />
        </div>
      </div>
    </main>
  );
};

export default LegalPage;
