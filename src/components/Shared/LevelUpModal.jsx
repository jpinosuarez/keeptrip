import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { COLORS, SHADOWS, RADIUS, FONTS, Z_INDEX } from '../../theme';

/**
 * Modal celebratorio al subir de nivel.
 * Dispara confetti al montar y muestra el nuevo nivel del viajero.
 *
 * @param {{ show: boolean, level: { icon: string, label: string, color: string } | null, onClose: () => void }} props
 */
const LevelUpModal = ({ show, level, onClose }) => {
  const fireConfetti = useCallback(() => {
    if (typeof window === 'undefined') return;
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: [level?.color || COLORS.atomicTangerine, '#FFD700', '#FF6B35'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: [level?.color || COLORS.atomicTangerine, '#FFD700', '#FF6B35'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    // Burst inicial
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: [level?.color || COLORS.atomicTangerine, '#FFD700', '#FF6B35', '#10B981'],
    });
    frame();
  }, [level]);

  useEffect(() => {
    if (show && level) fireConfetti();
  }, [show, level, fireConfetti]);

  if (!level) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: Z_INDEX.toast + 10,
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLORS.surface,
              borderRadius: RADIUS.xl,
              padding: '40px 48px',
              textAlign: 'center',
              maxWidth: '380px',
              width: '90%',
              boxShadow: SHADOWS.float,
              border: `2px solid ${level.color}40`,
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '12px', lineHeight: 1 }}>
              {level.icon}
            </div>
            <h2 style={{
              fontFamily: FONTS.heading, fontWeight: '900',
              fontSize: '1.5rem', color: COLORS.charcoalBlue, margin: '0 0 8px 0'
            }}>
              ¡Nuevo nivel!
            </h2>
            <p style={{
              fontFamily: FONTS.heading, fontWeight: '700',
              fontSize: '1.15rem', color: level.color, margin: '0 0 16px 0'
            }}>
              {level.label}
            </p>
            <p style={{
              fontFamily: FONTS.body,
              fontSize: '0.9rem', color: COLORS.textSecondary, margin: '0 0 24px 0', lineHeight: 1.5
            }}>
              Tu colección de sellos crece. Seguí explorando para alcanzar el siguiente nivel.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none', borderRadius: RADIUS.md,
                padding: '10px 24px',
                background: level.color, color: 'white',
                fontWeight: '800', fontSize: '0.9rem',
                fontFamily: FONTS.heading,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${level.color}40`,
              }}
            >
              ¡Genial! 🎉
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpModal;
