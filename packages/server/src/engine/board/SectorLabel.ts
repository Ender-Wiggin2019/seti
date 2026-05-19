import { ESector } from '@seti/common/types/element';
import type { Sector } from './Sector.js';

/**
 * Human-readable labels for sectors. The persisted sector id is "sector-N",
 * which is meaningless to players — these helpers turn it into the rulebook
 * form ("Red Barnard's Star") that lines up with the printed components.
 *
 * Keep all sector-facing UI strings going through here so a future rename
 * (e.g. localized labels) only needs one update.
 */

/** Render an `ESector` enum value as a capitalized English color name. */
export function formatSectorColorLabel(color: ESector | undefined): string {
  switch (color) {
    case ESector.RED:
      return 'Red';
    case ESector.YELLOW:
      return 'Yellow';
    case ESector.BLUE:
      return 'Blue';
    case ESector.BLACK:
      return 'Black';
    default:
      return '';
  }
}

/**
 * Convert a raw star name like `BARNARDS_STAR` / `barnards-star` into the
 * "Barnard's Star" form used in the rulebook. Returns an empty string on
 * missing/empty input.
 */
export function formatStarName(rawName: string | undefined): string {
  if (!rawName) return '';
  const lower = rawName.toString().toLowerCase().replace(/_/g, ' ');
  return lower
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const trimmed = word.replace(/^[^a-z0-9]+/i, '');
      if (trimmed.length === 0) return word;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .join(' ');
}

/**
 * "Red Barnard's Star (sector-3)" — the canonical user-facing label for any
 * sector option list. Falls back gracefully when only one of the parts is
 * known, and ultimately to the raw id.
 */
export function formatSectorOptionLabel(sector: Sector): string {
  const colorLabel = formatSectorColorLabel(sector.color);
  const starLabel = formatStarName(sector.name);
  if (colorLabel && starLabel) {
    return `${colorLabel} ${starLabel} (${sector.id})`;
  }
  if (starLabel) {
    return `${starLabel} (${sector.id})`;
  }
  if (colorLabel) {
    return `${colorLabel} ${sector.id}`;
  }
  return sector.id;
}
