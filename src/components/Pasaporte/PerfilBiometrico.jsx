import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS } from '../../theme';

const PerfilBiometrico = () => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    <h3 style={{ borderBottom: `2px solid ${COLORS.border}`, paddingBottom: '10px', color: '#1e293b', fontFamily: 'serif' }}>
      PERFIL BIOMÉTRICO
    </h3>
    <div style={{ display: 'flex', gap: '25px', marginTop: '30px' }}>
      <div style={{ 
        width: '140px', height: '170px', backgroundColor: COLORS.background, 
        border: `4px solid ${COLORS.surface}`, boxShadow: SHADOWS.md, 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <User size={60} color="#cbd5e1" />
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
        <div><label style={{ color: COLORS.textSecondary }}>ORIGEN</label><div style={{ fontWeight: 'bold' }}>ARGENTINA 🇦🇷</div></div>
        <div><label style={{ color: COLORS.textSecondary }}>RESIDENCIA</label><div style={{ fontWeight: 'bold' }}>BERLÍN 🇩🇪</div></div>
        <div><label style={{ color: COLORS.textSecondary }}>ESTUDIOS</label><div style={{ fontWeight: 'bold' }}>MKT - SIGLO 21</div></div>
        <div><label style={{ color: COLORS.textSecondary }}>OBJETIVO</label><div style={{ fontWeight: 'bold', color: '#3b82f6' }}>DATA SCIENCE</div></div>
      </div>
    </div>
    <div style={{ 
      marginTop: 'auto', padding: '12px', backgroundColor: COLORS.background, 
      border: `1px dashed ${COLORS.border}`, borderRadius: RADIUS.sm, 
      fontSize: '0.7rem', color: COLORS.textSecondary, letterSpacing: '1px' 
    }}>
      P&lt;ARGUSUARIO&lt;&lt;MARKETING&lt;BERLIN&lt;2026&lt;DS&lt;ML&lt;&lt;&lt;
    </div>
  </motion.div>
);

export default PerfilBiometrico;