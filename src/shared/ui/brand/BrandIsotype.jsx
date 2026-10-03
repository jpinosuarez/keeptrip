import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * BrandIsotype — Official Keeptrip Standalone Flight 'K' Vector Mark
 *
 * Supports fill="currentColor" to allow styling with design token utilities
 * (e.g. text-atomicTangerine, text-white, text-charcoalBlue).
 */
const BrandIsotype = ({
  className,
  size,
  ariaLabel = 'Keeptrip',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 110 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      width={size}
      height={size}
      className={cn('shrink-0 fill-current', className)}
      {...props}
    >
      <path
        d="M71.3118 62.8198C67.7648 66.3669 56.0398 74.1507 50.6207 77.5992C52.0987 79.5698 58.0104 88.2403 69.8339 107.158C81.6574 126.075 101.363 122.923 109.738 118.981C97.9146 101.739 73.6765 66.3669 71.3118 62.8198Z"
        fill="currentColor"
      />
      <path
        d="M0.370428 123.415H28.4512C26.9733 108.417 25.4958 82.033 47.6649 71.6874C71.3118 58.386 83.2927 43.114 87.5686 36.217L100.87 58.386L106.782 50.9963L99.3921 21.4376C103.333 17.0038 110.624 6.65827 108.26 0.746526C102.348 -2.80052 92.0024 7.15091 87.5686 12.57L59.4878 9.61416L53.5761 15.5259L75.7451 25.8714C66.878 36.217 40.2752 49.5184 34.3634 53.9522C25.879 60.3155 1.84886 76.1212 0.370428 101.246C-0.463012 115.41 0.370428 121.937 0.370428 123.415Z"
        fill="currentColor"
      />
      <path
        d="M26.9738 49.5183C15.1503 53.0654 4.3121 70.7021 0.370941 79.077V0.746487C18.1062 -1.61821 25.4958 14.5405 26.9738 22.9155V49.5183Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default BrandIsotype;
