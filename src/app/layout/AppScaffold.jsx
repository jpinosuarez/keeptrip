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
import './AppScaffold.css';

function AppScaffold({ invitationsCount, content, overlays, isMobile }) {
  return (
    <div 
      className="w-full bg-slate-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" // Safe area insets
      style={{
        display: 'flex',
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >

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
