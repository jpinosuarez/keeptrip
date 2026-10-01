/**
 * Compute col/row spans based on trip count and position for the Bento grid layout
 * @param {number} tripCount Total number of trips (1-4)
 * @param {number} index Position in array (0-based)
 * @returns {{ colSpan: number, rowSpan: number }}
 */
export const getGridSpan = (tripCount, index) => {
  if (tripCount === 1) {
    return { colSpan: 2, rowSpan: 2 }; // Hero card
  }
  if (tripCount === 2) {
    return { colSpan: 2, rowSpan: 1 }; // Side-by-side / stacked hero
  }
  if (tripCount === 3) {
    return index === 0
      ? { colSpan: 2, rowSpan: 1 } // First: full width
      : { colSpan: 1, rowSpan: 1 }; // Rest: half width
  }
  // tripCount === 4
  return { colSpan: 1, rowSpan: 1 }; // 2x2 grid
};
