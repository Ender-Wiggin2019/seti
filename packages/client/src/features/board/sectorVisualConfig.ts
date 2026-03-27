import {
  type ESectorPosition,
  type IResolvedTilePlacement,
  type ISolarSystemSetupConfig,
  resolveSetupConfig,
} from '@seti/common/constant/sectorSetup';
import type { IPublicSector } from '@/types/re-exports';

export interface ISectorPairConfig {
  placement: IResolvedTilePlacement;
  sectors: IPublicSector[];
}

export interface ISectorPositionStyle {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform?: string;
  width: string;
  height: string;
}

const POSITION_STYLES: Record<ESectorPosition, ISectorPositionStyle> = {
  north: {
    top: '0.2%',
    left: '12.5%',
    width: '75%',
    height: '30%',
  },
  west: {
    top: '35%',
    right: '47.1%',
    width: '75%',
    height: '30%',
    transform: 'rotate(-90deg)',
  },
  east: {
    top: '35%',
    left: '47.1%',
    width: '75%',
    height: '30%',
    transform: 'rotate(90deg)',
  },
  south: {
    bottom: '0.2%',
    left: '12.5%',
    width: '75%',
    height: '30%',
    transform: 'rotate(180deg)',
  },
};

export function getPositionStyle(
  position: ESectorPosition,
): ISectorPositionStyle {
  return POSITION_STYLES[position];
}

/**
 * Build the visual config for each sector tile pair from the setup config.
 * Groups `IPublicSector[]` by the tile they belong to (using sectorId matching).
 */
export function buildSectorPairs(
  setupConfig: ISolarSystemSetupConfig,
  sectors: IPublicSector[],
): ISectorPairConfig[] {
  const resolved = resolveSetupConfig(setupConfig);
  const sectorById = new Map(sectors.map((s) => [s.sectorId, s]));

  return resolved.map((placement) => {
    const matched = placement.sectorIds
      .map((id) => sectorById.get(id))
      .filter((s): s is IPublicSector => s != null);

    return {
      placement,
      sectors: matched,
    };
  });
}
