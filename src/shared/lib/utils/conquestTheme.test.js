import { describe, it, expect } from 'vitest';
import {
  CONQUEST_COLOR_THEMES,
  DEFAULT_CONQUEST_COLOR,
  CONQUEST_COLOR_UNLOCK_LEVEL,
  CONQUEST_COLOR_UNLOCK_XP,
  isConquestColorUnlocked,
  resolveConquestColor,
} from './conquestTheme';

describe('conquestTheme', () => {
  it('exposes the 5 brand conquest themes', () => {
    expect(CONQUEST_COLOR_THEMES).toHaveLength(5);
    expect(CONQUEST_COLOR_THEMES.map((theme) => theme.hex)).toEqual([
      '#FF6B35',
      '#F59E0B',
      '#6366F1',
      '#E11D48',
      '#8B5CF6',
    ]);
  });

  it('unlocks at Level 3 / 3001 XP', () => {
    expect(CONQUEST_COLOR_UNLOCK_LEVEL).toBe(3);
    expect(CONQUEST_COLOR_UNLOCK_XP).toBe(3001);
    expect(isConquestColorUnlocked(0)).toBe(false);
    expect(isConquestColorUnlocked(3000)).toBe(false);
    expect(isConquestColorUnlocked(3001)).toBe(true);
    expect(isConquestColorUnlocked(9999)).toBe(true);
  });

  it('falls back to the default when the perk is locked', () => {
    expect(resolveConquestColor({ conquestColor: '#E11D48' }, 100)).toBe(DEFAULT_CONQUEST_COLOR);
  });

  it('falls back to the default on missing or invalid stored values', () => {
    expect(resolveConquestColor({ conquestColor: '#123456' }, 5000)).toBe(DEFAULT_CONQUEST_COLOR);
    expect(resolveConquestColor(null, 5000)).toBe(DEFAULT_CONQUEST_COLOR);
    expect(resolveConquestColor({}, 5000)).toBe(DEFAULT_CONQUEST_COLOR);
  });

  it('returns the valid chosen theme (case-insensitive) when unlocked', () => {
    expect(resolveConquestColor({ conquestColor: '#e11d48' }, 5000)).toBe('#E11D48');
    expect(resolveConquestColor({ conquestColor: ' #6366f1 ' }, 5000)).toBe('#6366F1');
  });
});
