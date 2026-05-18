import type { TArkhosSecurityTrace } from '@seti/common/data/arkhosCards';
import { EAlienType } from '@seti/common/types/BaseCard';
import { EAlienIcon, ETrace } from '@seti/common/types/element';

export type {
  IArkhosAccessState,
  IArkhosExplorationCardData,
  IArkhosExplorationRewardRecord,
  IArkhosSecurityCardData,
  IArkhosSecurityCardState,
  TArkhosAccessByPlayer,
  TArkhosExplorationRewardSize,
  TArkhosSecurityCardsByPlayer,
  TArkhosSecurityCardZone,
  TArkhosSecurityTrace,
} from '@seti/common/data/arkhosCards';
export {
  ARKHOS_EXPLORATION_CARD_IDS,
  ARKHOS_EXPLORATION_CARDS,
  ARKHOS_SECURITY_CARD_IDS,
  ARKHOS_SECURITY_CARDS,
  getArkhosSecurityCardsByTrace,
} from '@seti/common/data/arkhosCards';

export type TGlyphidsGlyph =
  | EAlienIcon.GLYPH_GRAY
  | EAlienIcon.GLYPH_ORANGE
  | EAlienIcon.GLYPH_YELLOW
  | EAlienIcon.GLYPH_RED
  | EAlienIcon.GLYPH_GREEN
  | EAlienIcon.GLYPH_BLUE
  | EAlienIcon.GLYPH_PURPLE;

export type TGlyphidsTranslationGlyph = TGlyphidsGlyph | null;

export interface IGlyphidsTranslationRow {
  rowId: string;
  level: 1 | 2;
  glyphs: TGlyphidsTranslationGlyph[];
  side: 1 | 2;
}

export interface IGlyphidsTranslationPlacement {
  glyph: TGlyphidsGlyph;
  level: 1 | 2;
  position: number;
  rewardColumnIndex: number;
  rewardRowIndex: number;
  side: 1 | 2;
}

export interface IGlyphidsBoardToken {
  position: number;
  glyph: TGlyphidsGlyph;
}

export type TGlyphidsRowsByPlayer = Record<string, TGlyphidsGlyph[][]>;

export type TAmoebaOrganelle =
  | EAlienIcon.ORGANELLE_RED
  | EAlienIcon.ORGANELLE_YELLOW
  | EAlienIcon.ORGANELLE_BLUE;

export interface IAmoebaOrganelleToken {
  tokenId: string;
  color: TAmoebaOrganelle;
  position: number;
}

export type TSpaceAgencyBlockedAlienRewardPayloadId =
  | 'glyphids-translated-rewards'
  | 'amoeba-organelle-rewards'
  | 'arkhos-exploration-rewards';

export interface ISpaceAgencyBlockedAlienRewardPayload {
  id: TSpaceAgencyBlockedAlienRewardPayloadId;
  alien: EAlienType;
  blockedReason: 'missing-structured-payload-source';
  requiredSource: string;
}

export const SPACE_AGENCY_BLOCKED_ALIEN_REWARD_PAYLOADS: readonly ISpaceAgencyBlockedAlienRewardPayload[] =
  Object.freeze([
    {
      id: 'glyphids-translated-rewards',
      alien: EAlienType.GLYPHIDS,
      blockedReason: 'missing-structured-payload-source',
      requiredSource: 'frontend-reference dataSheet.alphabetTable',
    },
    {
      id: 'amoeba-organelle-rewards',
      alien: EAlienType.AMOEBA,
      blockedReason: 'missing-structured-payload-source',
      requiredSource: 'Amoeba organelle reward payload table',
    },
    {
      id: 'arkhos-exploration-rewards',
      alien: EAlienType.ARKHOS,
      blockedReason: 'missing-structured-payload-source',
      requiredSource: 'Arkhos effectSmall/effectBig payload table',
    },
  ]);

export const GLYPHIDS_ALIEN_CARD_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 10 }, (_, index) => `SA.ET.${index + 1}`),
);

export const AMOEBA_ALIEN_CARD_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 10 }, (_, index) => `SA.ET.${index + 11}`),
);

export const ARKHOS_ALIEN_CARD_IDS: readonly string[] = Object.freeze([]);

export const ARKHOS_TRACE_SLOTS: readonly {
  level: number;
  position: number;
  traceColor: TArkhosSecurityTrace;
}[] = Object.freeze([
  { level: 0, position: 0, traceColor: ETrace.RED },
  { level: 0, position: 1, traceColor: ETrace.YELLOW },
  { level: 0, position: 2, traceColor: ETrace.BLUE },
  { level: 1, position: 0, traceColor: ETrace.RED },
  { level: 1, position: 1, traceColor: ETrace.YELLOW },
  { level: 1, position: 2, traceColor: ETrace.BLUE },
  { level: 2, position: 0, traceColor: ETrace.RED },
  { level: 2, position: 1, traceColor: ETrace.YELLOW },
  { level: 2, position: 2, traceColor: ETrace.BLUE },
  { level: 3, position: 0, traceColor: ETrace.RED },
  { level: 3, position: 1, traceColor: ETrace.YELLOW },
  { level: 3, position: 2, traceColor: ETrace.BLUE },
]);

export const GLYPHIDS_GLYPHS: readonly TGlyphidsGlyph[] = Object.freeze([
  EAlienIcon.GLYPH_GRAY,
  EAlienIcon.GLYPH_ORANGE,
  EAlienIcon.GLYPH_YELLOW,
  EAlienIcon.GLYPH_RED,
  EAlienIcon.GLYPH_GREEN,
  EAlienIcon.GLYPH_BLUE,
  EAlienIcon.GLYPH_PURPLE,
]);

export const DEFAULT_GLYPHIDS_TOKEN_COPIES = 5;

export const GLYPHIDS_BOARD_TOKEN_POSITIONS: readonly number[] = Object.freeze([
  0, 3, 4, 7, 8, 11,
]);

export const DEFAULT_GLYPHIDS_TRANSLATION_ROWS: readonly IGlyphidsTranslationRow[] =
  Object.freeze([
    {
      rowId: 'glyphids-translation-level-1',
      level: 1,
      glyphs: [null, null, null, null],
      side: 1,
    },
    {
      rowId: 'glyphids-translation-level-2',
      level: 2,
      glyphs: [null, null, null],
      side: 1,
    },
  ]);

export const AMOEBA_ORGANELLE_START: readonly IAmoebaOrganelleToken[] =
  Object.freeze([
    {
      tokenId: 'amoeba-organelle-0',
      color: EAlienIcon.ORGANELLE_RED,
      position: 8,
    },
    {
      tokenId: 'amoeba-organelle-1',
      color: EAlienIcon.ORGANELLE_YELLOW,
      position: 4,
    },
    {
      tokenId: 'amoeba-organelle-2',
      color: EAlienIcon.ORGANELLE_BLUE,
      position: 5,
    },
    {
      tokenId: 'amoeba-organelle-3',
      color: EAlienIcon.ORGANELLE_RED,
      position: 2,
    },
    {
      tokenId: 'amoeba-organelle-4',
      color: EAlienIcon.ORGANELLE_YELLOW,
      position: 3,
    },
  ]);

export const AMOEBA_TRACE_SLOTS: readonly {
  position: number;
  traceColor: ETrace;
}[] = Object.freeze([
  { position: 0, traceColor: ETrace.BLUE },
  { position: 1, traceColor: ETrace.BLUE },
  { position: 2, traceColor: ETrace.RED },
  { position: 3, traceColor: ETrace.RED },
  { position: 4, traceColor: ETrace.YELLOW },
  { position: 5, traceColor: ETrace.YELLOW },
  { position: 6, traceColor: ETrace.YELLOW },
  { position: 7, traceColor: ETrace.RED },
  { position: 8, traceColor: ETrace.BLUE },
]);

export function createDefaultGlyphidsTokenBank(): TGlyphidsGlyph[] {
  return GLYPHIDS_GLYPHS.flatMap((glyph) =>
    Array.from({ length: DEFAULT_GLYPHIDS_TOKEN_COPIES }, () => glyph),
  );
}

export function createDefaultGlyphidsTranslationRows(
  sides: readonly [1 | 2, 1 | 2] = [1, 1],
): IGlyphidsTranslationRow[] {
  return DEFAULT_GLYPHIDS_TRANSLATION_ROWS.map((row, index) => ({
    ...row,
    side: sides[index] ?? 1,
    glyphs: [...row.glyphs],
  }));
}

export function createDefaultAmoebaOrganelles(): IAmoebaOrganelleToken[] {
  return AMOEBA_ORGANELLE_START.map((token) => ({ ...token }));
}
