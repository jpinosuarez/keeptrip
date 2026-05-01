import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind CSS classes safely.
 * Combines 'clsx' for conditional classes and 'tailwind-merge' to resolve conflicts.
 * 
 * @param {...ClassValue} inputs - Classes, objects, or arrays of classes
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
