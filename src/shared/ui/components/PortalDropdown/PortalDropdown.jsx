import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils/cn';

const PortalDropdown = ({ isOpen, onClose, triggerRef, children, minWidth = 160 }) => {
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });
  const [origin, setOrigin] = useState('top right');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current ? menuRef.current.offsetHeight : 150;
      
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      
      let top, transformOriginY;
      
      if (spaceBelow >= menuHeight + 8 || spaceBelow > spaceAbove) {
        top = triggerRect.bottom + 8;
        transformOriginY = 'top';
      } else {
        top = triggerRect.top - menuHeight - 8;
        transformOriginY = 'bottom';
      }

      let left = triggerRect.right - minWidth;
      
      if (left < 8) left = 8;
      
      if (left + minWidth > window.innerWidth - 8) {
        left = window.innerWidth - minWidth - 8;
      }

      setCoords({ top: top + window.scrollY, left: left + window.scrollX });
      setOrigin(`${transformOriginY} right`);
    };

    updatePosition();
    
    const timer = setTimeout(updatePosition, 10);
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef, minWidth]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen && typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9, y: origin.includes('top') ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: origin.includes('top') ? -10 : 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            "absolute bg-white/95 backdrop-blur-2xl rounded-xl shadow-2xl p-2",
            "z-dropdown flex flex-col gap-1 border border-border"

          )}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transformOrigin: origin,
            minWidth: `${minWidth}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PortalDropdown;
