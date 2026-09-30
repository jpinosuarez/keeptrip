import React from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from '@shared/ui/components';
import { cn } from '@shared/lib/utils/cn';

/**
 * CoverPickerModal - Bottom Sheet for selecting cover photo from gallery
 */
const CoverPickerModal = ({
  isOpen = false,
  fotos = [],
  currentPortadaUrl = null,
  onSelectCover = () => {},
  onClose = () => {},
}) => {
  const photoGrid = (() => {
    if (fotos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 px-5 text-center">
          <div className="text-[0.95rem] text-textSecondary font-medium">📝 No photos yet</div>
          <div className="text-[0.8rem] text-mutedTeal font-semibold tracking-tight">Upload photos in the Gallery section to set a cover</div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 w-full">
        {fotos.map((foto) => {
          const isSelected = currentPortadaUrl === foto.url;
          return (
            <div
              key={foto.id || foto.url}
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
              className={cn(
                "relative cursor-pointer rounded-md overflow-hidden transition-all aspect-square hover:border-atomicTangerine hover:shadow-[0_0_12px_rgba(255,107,53,0.18)]",
                isSelected 
                  ? "border-[3px] border-atomicTangerine shadow-[0_0_16px_rgba(255,107,53,0.25)]" 
                  : "border-2 border-border shadow-sm"
              )}
            >
              <img
                src={foto.url}
                alt="Gallery photo"
                className="w-full h-full object-cover block"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 bg-atomicTangerine text-white w-7 h-7 rounded-full flex items-center justify-center text-[1.2rem] font-extrabold shadow-md">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 py-6 pb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[1.1rem] font-extrabold text-charcoalBlue tracking-tight">Select Cover Photo</h3>
          <button
            className="bg-transparent border-none cursor-pointer text-textSecondary p-2 flex items-center justify-center transition-colors hover:text-charcoalBlue"
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
