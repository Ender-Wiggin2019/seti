import { EPlanet } from '@seti/common/types/element';
import type { IPlayerInputModel } from '@/types/re-exports';
import { EMainAction, EPlayerInputType } from '@/types/re-exports';
import type { SectionId } from './types';

/**
 * Pure pendingInput predicates lifted out of the legacy GameLayout. Used by
 * the SolarSystem / Planet / Alien adapters and the focus-jump effect in
 * GameLayoutV2 — keeping them here makes both consumers depend on a single
 * source of truth for "what tab does this input belong to".
 */

export function isAlienBoardInput(model: IPlayerInputModel | null): boolean {
  if (!model) return false;
  if (model.type === EPlayerInputType.TRACE) return true;
  if (model.type !== EPlayerInputType.OPTION) return false;
  return model.options.some(
    (option) =>
      /^alien-\d+-(?:discovery|overflow|anomaly-column|oumuamua-trace|mascamites|centaurians|exertians|glyphids|amoeba|arkhos)/.test(
        option.id,
      ) ||
      /^(?:mascamites-fixed|exertians-danger)-/.test(option.id) ||
      /^main-action-(?:land|orbit)-slot-oumuamua-/i.test(option.id),
  );
}

export function isPlanetaryBoardInput(
  model: IPlayerInputModel | null,
): boolean {
  if (!model) return false;
  if (model.type === EPlayerInputType.PLANET) return true;
  if (model.type !== EPlayerInputType.OPTION) return false;
  return model.options.some((option) =>
    /^main-action-(?:land|orbit)-(?:planet-(?!oumuamua\b)|slot-(?!oumuamua-))/i.test(
      option.id,
    ),
  );
}

export function getInputFocusSection(
  model: IPlayerInputModel | null,
): SectionId | null {
  if (isAlienBoardInput(model)) return 'alienBoard';
  if (isPlanetaryBoardInput(model)) return 'planetBoard';
  return null;
}

export function getSlotPickerMode(
  model: IPlayerInputModel | null,
): EMainAction.ORBIT | EMainAction.LAND | null {
  if (!model || model.type !== EPlayerInputType.OPTION) return null;
  const sample = model.options[0]?.id ?? '';
  if (/^main-action-orbit-slot-/.test(sample)) return EMainAction.ORBIT;
  if (/^main-action-land-slot-/.test(sample)) return EMainAction.LAND;
  return null;
}

export function resolveSlotPickerOptionId(
  model: IPlayerInputModel | null,
  planet: EPlanet,
  options?: { isMoon?: boolean; moonId?: string },
): string | null {
  if (!model || model.type !== EPlayerInputType.OPTION) return null;
  const isMoon = options?.isMoon === true;
  const moonId = options?.moonId;
  for (const option of model.options) {
    const landMatch = option.id.match(
      /^main-action-land-slot-([^-]+)-(planet|moon-(.+))$/,
    );
    if (landMatch) {
      const [, optionPlanet, kind, optionMoonId] = landMatch;
      if (optionPlanet !== planet) continue;
      if (!isMoon && kind === 'planet') return option.id;
      if (isMoon && optionMoonId !== undefined && optionMoonId === moonId) {
        return option.id;
      }
      continue;
    }
    const orbitMatch = option.id.match(
      /^main-action-orbit-slot-([^-]+)-(first|regular)$/,
    );
    if (orbitMatch) {
      const [, optionPlanet, kind] = orbitMatch;
      if (optionPlanet !== planet) continue;
      if (kind === 'first') return option.id;
    }
  }
  for (const option of model.options) {
    if (option.id === `main-action-orbit-slot-${planet}-regular`) {
      return option.id;
    }
  }
  return null;
}
