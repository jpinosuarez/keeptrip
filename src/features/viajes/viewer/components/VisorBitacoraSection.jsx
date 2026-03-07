import React from 'react';

const VisorBitacoraSection = ({ paradas, texto, styles }) => {
  const hasPerStopRelato = paradas.some((p) => p.relato && p.relato.trim());
  if (hasPerStopRelato) return null;

  return (
    <>
      <h3 style={styles.sectionTitle}>Bitácora</h3>
      <p style={styles.readText}>{texto || 'Sin relato aun...'}</p>
    </>
  );
};

export default VisorBitacoraSection;
