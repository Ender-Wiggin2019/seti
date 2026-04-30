import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ExcavationRover } from '@/engine/cards/alien/ExcavationRoverCard.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

function resolveCardInputs(input: IPlayerInput | undefined): void {
  let pending = input;
  let guard = 0;
  while (pending) {
    guard += 1;
    if (guard > 20) throw new Error('input resolution exceeded 20 steps');
    const model = pending.toModel();
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

function playAndDrain(card: ExcavationRover, seed: string, landed: boolean) {
  const game = buildTestGame({ seed });
  const player = getPlayer(game, 'p1');
  discoverOumuamua(game);
  if (landed) {
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_LANDED,
      planet: EPlanet.OUMUAMUA,
      isMoon: false,
    });
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

describe('ExcavationRover', () => {
  it('scores 3 VP if a probe landed on Oumuamua this turn', () => {
    const card = new ExcavationRover();

    const withoutLanding = playAndDrain(card, 'et-30-no-landing', false);
    const withLanding = playAndDrain(card, 'et-30-with-landing', true);

    expect(card.id).toBe('ET.30');
    expect(card.behavior.custom ?? []).not.toContain('desc.et-30');
    expect(withLanding - withoutLanding).toBe(3);
  });
});
