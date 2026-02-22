import React from 'react';
import { motion } from 'framer-motion';
import { Navigation2 } from 'lucide-react';
import { RADIUS } from '../../theme';

const Portada = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    style={{ 
      height: '100%', 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#1a365d', 
      backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#d4af37', 
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
      position: 'absolute', // Cubre todo el espacio del contenedor
      top: 0,
      left: 0
    }}
  >
    <div style={{ 
      border: '2px solid rgba(212, 175, 55, 0.5)', 
      padding: '35px', 
      borderRadius: RADIUS.full, 
      marginBottom: '30px',
      backgroundColor: 'rgba(0,0,0,0.1)'
    }}>
      <Navigation2 size={55} color="#d4af37" fill="#d4af37" />
    </div>

    <h1 style={{ 
      fontSize: '2rem', 
      letterSpacing: '12px', 
      fontWeight: 'bold', 
      textAlign: 'center',
      margin: 0,
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      PASAPORTE
    </h1>

    <div style={{ width: '50px', height: '1.5px', backgroundColor: '#d4af37', margin: '30px 0', opacity: 0.6 }}></div>

    <p style={{ letterSpacing: '6px', fontSize: '0.75rem', opacity: 0.9, fontWeight: 'bold' }}>
      GLOBAL STAMP
    </p>

    <div style={{
      position: 'absolute',
      bottom: '40px',
      fontSize: '0.6rem',
      letterSpacing: '3px',
      opacity: 0.4,
      fontWeight: 'bold'
    }}>
      EST. 2026
    </div>
  </motion.div>
);

export default Portada;