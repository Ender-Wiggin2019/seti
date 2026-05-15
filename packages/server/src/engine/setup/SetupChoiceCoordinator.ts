import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  type ISetupChoiceContext,
  type ISetupChoiceStepContext,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import { SelectOption } from '../input/SelectOption.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  type ISetupChoiceConfig,
  type ISetupChoiceStepConfig,
  toSetupChoiceCandidate,
} from './SetupChoiceConfig.js';

type TOnAllPlayersDone = () => void;
type TCreatePlayerSetupChoiceConfig = (player: IPlayer) => ISetupChoiceConfig;
const DONE_OPTION_ID = '__setup-choice-done';

function cloneContext(context: ISetupChoiceContext): ISetupChoiceContext {
  return JSON.parse(JSON.stringify(context)) as ISetupChoiceContext;
}

function createContext(config: ISetupChoiceConfig): ISetupChoiceContext {
  return {
    currentStepIndex: 0,
    completed: config.steps.length === 0,
    steps: config.steps.map((step) => ({
      kind: step.kind,
      title: step.title,
      minSelections: step.minSelections,
      maxSelections: step.maxSelections,
      candidates: step.candidates.map((candidate) =>
        toSetupChoiceCandidate(candidate),
      ),
      selectedIds: [],
      completed: false,
    })),
  };
}

function assertCandidateIdsAreUsable(step: ISetupChoiceStepContext): void {
  if (step.candidates.some((candidate) => candidate.id === DONE_OPTION_ID)) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      'Setup choice candidate id is reserved',
      { reservedId: DONE_OPTION_ID, stepKind: step.kind },
    );
  }
}

function getCurrentStep(
  context: ISetupChoiceContext,
): ISetupChoiceStepContext | undefined {
  return context.steps[context.currentStepIndex];
}

function getSelectableCandidates(step: ISetupChoiceStepContext) {
  return step.candidates.filter(
    (candidate) =>
      candidate.canChoose && !step.selectedIds.includes(candidate.id),
  );
}

function allPlayersDone(players: readonly IPlayer[]): boolean {
  return players.every((player) => player.setupChoiceContext?.completed);
}

function stepConfigFor(
  config: ISetupChoiceConfig | undefined,
  step: ISetupChoiceStepContext,
): ISetupChoiceStepConfig | undefined {
  return config?.steps.find((candidate) => candidate.kind === step.kind);
}

export class SetupChoiceCoordinator {
  public static begin(
    players: readonly IPlayer[],
    config: ISetupChoiceConfig,
    onAllPlayersDone?: TOnAllPlayersDone,
  ): void {
    SetupChoiceCoordinator.beginPerPlayer(
      players,
      () => config,
      onAllPlayersDone,
    );
  }

  public static beginPerPlayer(
    players: readonly IPlayer[],
    createConfig: TCreatePlayerSetupChoiceConfig,
    onAllPlayersDone?: TOnAllPlayersDone,
  ): void {
    for (const player of players) {
      const config = createConfig(player);
      player.setupChoiceContext = createContext(config);
      player.quickStartCardIds = [];
      player.waitingFor = SetupChoiceCoordinator.advancePlayer(
        player,
        players,
        config,
        onAllPlayersDone,
      );
    }
  }

  public static rehydratePendingInput(
    player: IPlayer,
    players: readonly IPlayer[],
    onAllPlayersDone?: TOnAllPlayersDone,
  ) {
    if (!player.setupChoiceContext || player.setupChoiceContext.completed) {
      return undefined;
    }

    return SetupChoiceCoordinator.advancePlayer(
      player,
      players,
      undefined,
      onAllPlayersDone,
    );
  }

  private static advancePlayer(
    player: IPlayer,
    players: readonly IPlayer[],
    config: ISetupChoiceConfig | undefined,
    onAllPlayersDone?: TOnAllPlayersDone,
  ) {
    const context = player.setupChoiceContext;
    if (!context) return undefined;

    while (!context.completed) {
      const step = getCurrentStep(context);
      if (!step) {
        context.completed = true;
        break;
      }
      assertCandidateIdsAreUsable(step);

      const sourceStep = stepConfigFor(config, step);
      const stepEnabled = sourceStep?.enabled ?? true;
      const stepAllowed = sourceStep?.permission?.canChoose ?? true;
      if (!stepEnabled || !stepAllowed) {
        step.completed = true;
        context.currentStepIndex += 1;
        continue;
      }

      const selectableCandidates = getSelectableCandidates(step);
      if (step.selectedIds.length >= step.maxSelections) {
        step.completed = true;
        context.currentStepIndex += 1;
        continue;
      }

      if (
        sourceStep?.autoSelect === 'single-candidate' &&
        step.minSelections <= 1 &&
        step.maxSelections === 1 &&
        selectableCandidates.length === 1
      ) {
        step.selectedIds.push(selectableCandidates[0].id);
        step.completed = true;
        context.currentStepIndex += 1;
        continue;
      }

      if (selectableCandidates.length === 0) {
        step.completed = step.selectedIds.length >= step.minSelections;
        if (!step.completed) {
          throw new Error(`No selectable candidates for ${step.kind}`);
        }
        context.currentStepIndex += 1;
        continue;
      }

      return SetupChoiceCoordinator.createInput(
        player,
        players,
        step,
        context,
        config,
        onAllPlayersDone,
      );
    }

    context.completed = true;
    player.setupChoiceContext = cloneContext(context);
    if (allPlayersDone(players)) {
      onAllPlayersDone?.();
    }
    return undefined;
  }

  private static createInput(
    player: IPlayer,
    players: readonly IPlayer[],
    step: ISetupChoiceStepContext,
    context: ISetupChoiceContext,
    config: ISetupChoiceConfig | undefined,
    onAllPlayersDone?: TOnAllPlayersDone,
  ): SelectOption {
    const canSelectMore = step.selectedIds.length < step.maxSelections;
    const options = canSelectMore
      ? getSelectableCandidates(step).map((candidate) => ({
          id: candidate.id,
          label: candidate.label,
          onSelect: () => {
            step.selectedIds.push(candidate.id);
            if (step.selectedIds.length >= step.maxSelections) {
              step.completed = true;
              context.currentStepIndex += 1;
            }
            return SetupChoiceCoordinator.advancePlayer(
              player,
              players,
              config,
              onAllPlayersDone,
            );
          },
        }))
      : [];

    if (step.selectedIds.length >= step.minSelections) {
      options.push({
        id: DONE_OPTION_ID,
        label: step.selectedIds.length === 0 ? 'Skip' : 'Done',
        onSelect: () => {
          step.completed = true;
          context.currentStepIndex += 1;
          return SetupChoiceCoordinator.advancePlayer(
            player,
            players,
            config,
            onAllPlayersDone,
          );
        },
      });
    }

    return new SelectOption(player, options, step.title, {
      kind: step.kind,
      stepIndex: context.currentStepIndex,
      totalSteps: context.steps.length,
      minSelections: step.minSelections,
      maxSelections: step.maxSelections,
    });
  }
}
