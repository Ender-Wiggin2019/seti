import type { ESector } from '@seti/common/types/element';
import { ETrace } from '@seti/common/types/protocol/enums';
import type { ISelectOptionInputModel } from '@seti/common/types/protocol/playerInput';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AmazingUncertaintyCard } from '@/engine/cards/alien/AmazingUncertaintyCard.js';
import {
  addAnomalyToken,
  createAnomaliesGame,
  resolveDeferredInputs,
  toAnySignalOptionId,
} from './AnomaliesCardTestHelpers.js';

describe('AmazingUncertaintyCard', () => {
  it('keeps any-signal choice and scores one point per own signal in anomaly sectors', () => {
    const { game, player } = createAnomaliesGame('amazing-uncertainty');
    addAnomalyToken(game, 0, ETrace.RED);
    addAnomalyToken(game, 2, ETrace.YELLOW);
    game.sectors[0].markSignal(player.id);
    game.sectors[0].markSignal(player.id);
    game.sectors[2].markSignal(player.id);
    game.sectors[4].markSignal(player.id);

    const targetSectorId = game.sectors[0].id;
    const targetColor = game.sectors[0].color as ESector;
    const scoreBefore = player.score;
    let sawAnySignalPrompt = false;

    new AmazingUncertaintyCard().play({ player, game });
    resolveDeferredInputs(game, (model) => {
      if (model.type !== EPlayerInputType.OPTION) return '';
      const optionModel = model as ISelectOptionInputModel;
      if (
        optionModel.options.some((option) =>
          option.id.startsWith('any-signal-'),
        )
      ) {
        sawAnySignalPrompt = true;
        return toAnySignalOptionId(targetColor);
      }
      return (
        optionModel.options.find((option) => option.id === targetSectorId)
          ?.id ?? ''
      );
    });

    expect(sawAnySignalPrompt).toBe(true);
    expect(player.score).toBe(scoreBefore + 4);
  });
});
