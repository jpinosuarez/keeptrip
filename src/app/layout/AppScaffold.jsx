import React from 'react';
import { motion } from 'framer-motion';

import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Header/Header';
import { styles } from './App.styles';

const Motion = motion;

function AppScaffold({
  isMobile,
  sidebarCollapsed,
  invitationsCount,
  content,
  overlays,
}) {
  return (
    <div style={styles.appWrapper}>
      <Sidebar isMobile={isMobile} />

      <Motion.main
        style={{
          ...styles.mainContent(isMobile),
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? '80px' : '260px')
        }}
      >
        <Header
          isMobile={isMobile}
          invitationsCount={invitationsCount}
        />

        <section style={styles.sectionWrapper(isMobile)}>
          {content}
        </section>
      </Motion.main>

      {overlays}
    </div>
  );
}

export default AppScaffold;
