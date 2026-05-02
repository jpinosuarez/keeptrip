import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LegalDocumentViewer from '@shared/ui/legal/LegalDocumentViewer';
import legalES from '../../../i18n/locales/es/legal.json';
import { cn } from '@shared/lib/utils/cn';

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
    <main className="h-[100dvh] bg-background p-5 md:p-10 lg:p-20 box-border overflow-hidden">
      <div className="w-full h-full max-w-[920px] mx-auto bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden flex flex-col">
        <header className="px-6 py-10 md:px-10 md:py-12 border-b border-slate-200 bg-gradient-to-b from-white/98 to-slate-50/92">
          <h1 className="m-0 text-charcoalBlue font-heading text-[1.6rem] md:text-[2rem] leading-tight">
            {legalES.ui.title}
          </h1>
          <p className="mt-2.5 text-text-secondary font-body text-base leading-relaxed">
            {legalES.ui.subtitle}
          </p>
        </header>

        <nav
          aria-label="Selector de documentos legales"
          className="sticky top-0 z-10 flex gap-2 overflow-x-auto px-6 py-4 md:px-10 bg-white border-b border-slate-200"
        >
          {TABS.map((tab) => {
            const isActive = activeDoc === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSwitchDoc(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "min-h-[44px] px-6 rounded-full font-body text-[0.95rem] font-bold cursor-pointer whitespace-nowrap transition-all",
                  isActive
                    ? "bg-gradient-to-br from-atomicTangerine to-[#ff9154] text-white border-none shadow-[0_6px_18px_rgba(255,126,66,0.25)]"
                    : "bg-white text-charcoalBlue border border-slate-200 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-6 min-h-0 flex-1 flex overflow-y-auto overflow-x-hidden touch-pan-y">
          <LegalDocumentViewer docType={activeDoc} />
        </div>
      </div>
    </main>
  );
};

export default LegalPage;

