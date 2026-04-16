import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '@shared/config';

const DOC_MAP = {
  privacy: 'privacyPolicy',
  terms: 'termsOfService',
  cookies: 'cookiePolicy',
};

const SECTION_SPACING = 24;

const LegalDocumentViewer = ({ docType = 'privacy' }) => {
  const { t } = useTranslation('legal');
  const documentKey = DOC_MAP[docType] || DOC_MAP.privacy;
  
  const documentData = useMemo(() => t(documentKey, { returnObjects: true }) || {}, [t, documentKey]);

  const sections = useMemo(() => {
    if (!Array.isArray(documentData?.sections)) return [];
    return documentData.sections;
  }, [documentData]);

  return (
    <article
      style={{
        padding: `0 ${SPACING.lg} ${SPACING.xl}`,
        color: COLORS.textTertiary,
        lineHeight: 1.7,
        minHeight: 0,
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <header style={{ marginBottom: SPACING.lg }}>
        <h2
          style={{
            margin: 0,
            color: COLORS.textPrimary,
            fontFamily: FONTS.heading,
            fontSize: '1.5rem',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {documentData?.title}
        </h2>
        {documentData?.summary && (
          <p
            style={{
              margin: `${SPACING.md} 0 0`,
              color: COLORS.textTertiary,
              fontFamily: FONTS.body,
              fontSize: '1rem',
            }}
          >
            {documentData.summary}
          </p>
        )}
      </header>

      <div>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            style={{
              marginBottom: `${SECTION_SPACING}px`,
              scrollMarginTop: '96px',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: COLORS.textPrimary,
                fontFamily: FONTS.heading,
                fontSize: '1.25rem',
                lineHeight: 1.35,
              }}
            >
              {section.title}
            </h3>

            <div style={{ marginTop: SPACING.md, display: 'grid', gap: SPACING.md }}>
              {(section.paragraphs || []).map((paragraph, index) => (
                <p
                  key={`${section.id}-${index}`}
                  style={{
                    margin: 0,
                    color: COLORS.textTertiary,
                    fontFamily: FONTS.body,
                    fontSize: '1rem',
                    lineHeight: 1.75,
                    maxWidth: '75ch',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
};

export default LegalDocumentViewer;
