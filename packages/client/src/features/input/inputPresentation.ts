import type {
  IPlayerInputModel,
  ISelectOptionInputModel,
} from '@/types/re-exports';
import {
  EPlayerInputPresentationMode,
  EPlayerInputType,
} from '@/types/re-exports';

export interface IPlayerInputPresentationContext {
  cardRowCardIds?: ReadonlySet<string>;
}

export const ORBITAL_DYNAMICS_MOVE_INPUT_TITLE =
  'Choose an Orbital Dynamics move';

export function isOrbitalDynamicsMoveInputModel(
  model: IPlayerInputModel | null,
): model is ISelectOptionInputModel {
  return (
    model?.type === EPlayerInputType.OPTION &&
    model.title === ORBITAL_DYNAMICS_MOVE_INPUT_TITLE
  );
}

export function getPlayerInputPresentationMode(
  model: IPlayerInputModel | null,
  context: IPlayerInputPresentationContext = {},
): EPlayerInputPresentationMode | null {
  if (!model) return null;
  if (model.presentationMode) return model.presentationMode;
  if (model.setupChoice) return EPlayerInputPresentationMode.DIALOG_ONLY;

  switch (model.type) {
    case EPlayerInputType.CARD:
      return isCardRowCardInput(model, context)
        ? EPlayerInputPresentationMode.IN_GAME_INTERACTIVE
        : EPlayerInputPresentationMode.DIALOG_ONLY;
    case EPlayerInputType.SECTOR:
    case EPlayerInputType.PLANET:
      return EPlayerInputPresentationMode.IN_GAME_INTERACTIVE;
    case EPlayerInputType.OPTION:
      return isOrbitalDynamicsMoveInputModel(model) ||
        isSectorOptionInput(model) ||
        isAlienTraceSlotOptionInput(model)
        ? EPlayerInputPresentationMode.IN_GAME_INTERACTIVE
        : EPlayerInputPresentationMode.DIALOG_ONLY;
    case EPlayerInputType.TECH:
    case EPlayerInputType.GOLD_TILE:
    case EPlayerInputType.RESOURCE:
    case EPlayerInputType.TRACE:
    case EPlayerInputType.END_OF_ROUND:
    case EPlayerInputType.OR:
    case EPlayerInputType.AND:
      return EPlayerInputPresentationMode.DIALOG_ONLY;
    default:
      return EPlayerInputPresentationMode.DIALOG_ONLY;
  }
}

function isCardRowCardInput(
  model: IPlayerInputModel,
  context: IPlayerInputPresentationContext,
): boolean {
  if (model.type !== EPlayerInputType.CARD) return false;
  if (!context.cardRowCardIds || model.cards.length === 0) return false;
  return model.cards.every((card) => context.cardRowCardIds?.has(card.id));
}

function isSectorOptionInput(model: ISelectOptionInputModel): boolean {
  return (
    model.options.length > 0 &&
    model.options.every((option) => /^sector-\d+$/.test(option.id))
  );
}

export function isAlienTraceSlotOptionInput(
  model: ISelectOptionInputModel,
): boolean {
  return (
    model.options.length > 0 &&
    model.options.every(
      (option) =>
        /^alien-\d+-(?:discovery|overflow|anomaly-column|oumuamua-trace|mascamites|centaurians|exertians|glyphids|amoeba|arkhos)/.test(
          option.id,
        ) || /^(?:mascamites-fixed|exertians-danger)-/.test(option.id),
    )
  );
}

export function shouldRenderPendingInputPrompt(
  model: IPlayerInputModel | null,
): boolean {
  // Render a prompt for any pending input. (OR inputs were previously
  // excluded, which left them with no interactive widget at all — a
  // guaranteed deadlock. They present as a dialog via OrOptionsInput.)
  return model !== null;
}

export function usesDialogPresentation(
  mode: EPlayerInputPresentationMode | null,
): boolean {
  return (
    mode === EPlayerInputPresentationMode.DIALOG_ONLY ||
    mode === EPlayerInputPresentationMode.DIALOG_AND_IN_GAME
  );
}

export function usesInGamePresentation(
  mode: EPlayerInputPresentationMode | null,
): boolean {
  return (
    mode === EPlayerInputPresentationMode.IN_GAME_INTERACTIVE ||
    mode === EPlayerInputPresentationMode.DIALOG_AND_IN_GAME
  );
}
