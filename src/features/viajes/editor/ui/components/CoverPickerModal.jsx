import React from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from '@shared/ui/components';
import { COLORS, RADIUS, SHADOWS, TRANSITIONS } from '@shared/config';

/**
 * CoverPickerModal - Bottom Sheet for selecting cover photo from gallery
 * 
 * Single Source of Truth Pattern:
 * - Gallery (EdicionGallerySection) is the ONLY uploader to Firebase
 * - Header (EdicionHeaderSection) only PREVIEWS
 * - This modal bridges them: user picks from gallery to set as cover
 * 
 * Features:
 * - Mobile-first BottomSheet
 * - Grid display of existing photos
 * - Visual indicator for current cover
 * - Empty state hint
 * - Auto-close after selection
 */
const CoverPickerModal = ({
  isOpen = false,
  fotos = [],
  currentPortadaUrl = null,
  onSelectCover = () => {},
  onClose = () => {},
}) => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px 20px 40px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: '800',
      color: COLORS.charcoalBlue,
      letterSpacing: '0.3px',
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.textSecondary,
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: TRANSITIONS.fast,
      '&:hover': {
        color: COLORS.charcoalBlue,
      },
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: '12px',
      width: '100%',
    },
    photoCard: (isSelected) => ({
      position: 'relative',
      cursor: 'pointer',
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      border: isSelected ? `3px solid ${COLORS.atomicTangerine}` : `2px solid ${COLORS.border}`,
      boxShadow: isSelected ? `0 0 16px ${COLORS.atomicTangerine}40` : SHADOWS.sm,
      transition: TRANSITIONS.fast,
      aspectRatio: '1 / 1',
      '&:hover': {
        borderColor: COLORS.atomicTangerine,
        boxShadow: `0 0 12px ${COLORS.atomicTangerine}30`,
      },
    }),
    photoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    selectedBadge: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: COLORS.atomicTangerine,
      color: 'white',
      width: '28px',
      height: '28px',
      borderRadius: RADIUS.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      fontWeight: '800',
      boxShadow: SHADOWS.md,
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '40px 20px',
      textAlign: 'center',
    },
    emptyText: {
      fontSize: '0.95rem',
      color: COLORS.textSecondary,
      fontWeight: '500',
    },
    emptyHint: {
      fontSize: '0.8rem',
      color: COLORS.mutedTeal,
      fontWeight: '600',
      letterSpacing: '0.2px',
    },
  };

  const photoGrid = (() => {
    if (fotos.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyText}>📝 No photos yet</div>
          <div style={styles.emptyHint}>Upload photos in the Gallery section to set a cover</div>
        </div>
      );
    }

    return (
      <div style={styles.grid}>
        {fotos.map((foto) => {
          const isSelected = currentPortadaUrl === foto.url;
          return (
            <div
              key={foto.id || foto.url}
              style={styles.photoCard(isSelected)}
              onClick={() => {
                onSelectCover(foto.url, foto.id);
                onClose();
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectCover(foto.url, foto.id);
                  onClose();
                }
              }}
            >
              <img
                src={foto.url}
                alt="Gallery photo"
                style={styles.photoImage}
                loading="lazy"
              />
              {isSelected && <div style={styles.selectedBadge}>✓</div>}
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Select Cover Photo</h3>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {photoGrid}
      </div>
    </BottomSheet>
  );
};

export default CoverPickerModal;
