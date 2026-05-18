import type {
  IGlyphidsTranslationRow,
  TGlyphidsGlyph,
} from '@seti/common/constant/spaceAgencyAliens';

export function getTranslatedGlyph(
  translationRows: readonly IGlyphidsTranslationRow[],
  glyph: TGlyphidsGlyph,
) {
  for (const row of translationRows) {
    const position = row.glyphs.indexOf(glyph);
    if (position >= 0) {
      return {
        glyph,
        level: row.level,
        position,
        rewardColumnIndex: position + 1,
        rewardRowIndex: (row.level - 1) * 2 + (row.side - 1),
        side: row.side,
      };
    }
  }
  return undefined;
}

export function placeGlyphOnTranslationTable(
  translationRows: IGlyphidsTranslationRow[],
  level: 1 | 2,
  position: number,
  glyph: TGlyphidsGlyph,
): boolean {
  if (translationRows.some((row) => row.glyphs.includes(glyph))) {
    return false;
  }

  const row = translationRows.find((candidate) => candidate.level === level);
  if (!row || !Number.isInteger(position) || position < 0) {
    return false;
  }
  if (position >= row.glyphs.length || row.glyphs[position] !== null) {
    return false;
  }
  if (level === 2 && !hasTranslationSupport(translationRows, position)) {
    return false;
  }

  row.glyphs[position] = glyph;
  return true;
}

function hasTranslationSupport(
  translationRows: readonly IGlyphidsTranslationRow[],
  position: number,
): boolean {
  const lowerRow = translationRows.find((row) => row.level === 1);
  if (!lowerRow || position + 1 >= lowerRow.glyphs.length) return false;
  return (
    lowerRow.glyphs[position] !== null &&
    lowerRow.glyphs[position + 1] !== null
  );
}
