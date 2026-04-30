import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { VisitorInTheSky } from '@/engine/cards/alien/VisitorInTheSkyCard.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function resolveCardInputs(input: IPlayerInput | undefined): void {
  let pending = input;
  let guard = 0;
  while (pending) {
    guard += 1;
    if (guard > 20) throw new Error('input resolution exceeded 20 steps');
    const model = pending.toModel();
    if (model.type === EPlayerInputType.CARD) {
      const card = model.cards[0];
      if (!card) throw new Error('missing card option');
      pending = pending.process({
        type: EPlayerInputType.CARD,
        cardIds: [card.id],
      });
      continue;
    }
    if (model.type !== EPlayerInputType.OPTION) {
      throw new Error(`unsupported input type ${model.type}`);
    }
    const option = model.options[0];
    if (!option) throw new Error('missing option');
    pending = pending.process({
      type: EPlayerInputType.OPTION,
      optionId: option.id,
    });
  }
}

function playAndDrain(
  card: VisitorInTheSky,
  seed: string,
  tileMarkers: number,
) {
  const game = buildTestGame({ seed });
  const player = getPlayer(game, 'p1');
  const { plugin } = discoverOumuamua(game);
  for (let i = 0; i < tileMarkers; i += 1) {
    plugin.markTileSignal(player, game);
  }
  const scoreBefore = player.score;

  card.play({ player, game });
  let pending = game.deferredActions.drain(game);
  while (pending) {
    resolveCardInputs(pending);
    pending = game.deferredActions.drain(game);
  }

  return player.score - scoreBefore;
}

describe('VisitorInTheSky', () => {
  it('scores 2 VP per player marker on the Oumuamua tile', () => {
    const card = new VisitorInTheSky();

    const withoutMarkers = playAndDrain(card, 'et-21-no-markers', 0);
    const withMarkers = playAndDrain(card, 'et-21-two-markers', 2);

    expect(card.id).toBe('ET.21');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-21');
    expect(withMarkers - withoutMarkers).toBe(4);
  });
});
