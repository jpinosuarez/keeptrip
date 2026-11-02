import React from 'react';

const SIZE_CLASSES = {
  xs: 'w-3.5 h-2.5',
  sm: 'w-4 h-3',
  md: 'w-5 h-3.5',
  lg: 'w-6 h-4',
  xl: 'w-8 h-5.5',
};

export const CountryFlag = ({ code, size = 'md', className = '' }) => {
  if (!code || typeof code !== 'string' || code.trim().length !== 2) {
    return null;
  }

  const normalized = code.trim().toLowerCase();
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <img
      src={`https://flagcdn.com/w40/${normalized}.png`}
      srcSet={`https://flagcdn.com/w80/${normalized}.png 2x`}
      alt={code.toUpperCase()}
      loading="lazy"
      decoding="async"
      className={`inline-block object-cover rounded-[3px] shadow-2xs shrink-0 ${sizeClass} ${className}`}
    />
  );
};

export default CountryFlag;
