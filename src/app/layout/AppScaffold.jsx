/**
 * AppScaffold — 2026 Spatial Layout Shell
 *
 * Strategy (CSS-First, Performance Guardrail #2):
 *   - Desktop: 80px left margin for the Fluid Rail (static, no JS animation for layout).
 *   - Mobile:  0 left margin + extra bottom padding for the floating Tab Bar.
 *   - The Switch happens via CSS class on the <main> tag — no JS breakpoint detection needed.
 *
 * The Header is sticky inside <main>, and the Sidebar renders outside (fixed positioning).
 */
import React from 'react';
import { Sidebar } from '@widgets/sidebar';
import { Header } from '@widgets/header';

// Inject scaffold CSS once
const SCAFFOLD_CSS = `
  .scaffold-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    position: relative;
    overflow: hidden;
    margin-left: 80px; /* Fluid Rail width */
  }

  .scaffold-content {
    flex: 1;
    padding: 16px 24px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    .scaffold-main {
      margin-left: 0 !important;
    }
    .scaffold-content {
      padding: 12px 12px 100px; /* 100px bottom clearance for Tab Bar */
    }
  }
`;

function injectScaffoldStyles() {
  const id = 'keeptrip-scaffold-styles';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = SCAFFOLD_CSS;
  document.head.appendChild(el);
}

function AppScaffold({ invitationsCount, content, overlays, isMobile }) {
  // Inject once — idempotent
  injectScaffoldStyles();

  return (
    <div style={{ display: 'flex', backgroundColor: '#F8FAFC', height: '100dvh', width: '100%', overflow: 'hidden' }}>
      <Sidebar />

      <main className="scaffold-main">
        <Header
          isMobile={isMobile}
          invitationsCount={invitationsCount}
        />

        <section className="scaffold-content">
          {content}
        </section>
      </main>

      {overlays}
    </div>
  );
}

export default AppScaffold;
