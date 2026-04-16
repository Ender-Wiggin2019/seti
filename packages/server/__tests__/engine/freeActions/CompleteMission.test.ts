import { ETrace } from '@seti/common/types/element';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Game } from '@/engine/Game.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

describe('CompleteMissionFreeAction', () => {
  it('completes an active quick mission through game.processFreeAction', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-integration',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    player.playedMissions.push(card);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    const dataBefore = player.resources.data;

    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '64',
    });

    expect(player.resources.data).toBe(dataBefore + 2);
    expect(player.playedMissions).toHaveLength(0);
    expect(player.completedMissions).toHaveLength(1);
    expect(
      game.missionTracker.getMissionState(player.id, '64'),
    ).toBeUndefined();
  });

  it('rejects completing a full mission through game.processFreeAction', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-branch-index',
    );
    const player = game.players[0];

    game.missionTracker.registerMissionFromCard('106', player.id);
    player.playedMissions.push('106');

    const publicityBefore = player.resources.publicity;
    const handBefore = player.hand.length;

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '106',
        branchIndex: 2,
      }),
    ).toThrow('Mission 106 branch 2 is not completable');

    const missionState = game.missionTracker.getMissionState(player.id, '106');
    expect(player.resources.publicity).toBe(publicityBefore);
    expect(player.hand).toHaveLength(handBefore);
    expect(missionState).toBeDefined();
    expect(missionState!.branchStates[2].completed).toBe(false);
    expect(missionState!.branchStates[0].completed).toBe(false);
    expect(missionState!.branchStates[1].completed).toBe(false);
  });

  it('rejects completing a quick mission that has not been played yet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-not-played',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '64',
      }),
    ).toThrow('Mission 64 branch 0 is not completable');

    expect(player.completedMissions).toHaveLength(0);
    expect(game.missionTracker.getMissionState(player.id, '64')).toBeDefined();
  });

  it('rejects completing the same quick mission twice', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-double-complete',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    player.playedMissions.push(card);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '64',
    });

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '64',
      }),
    ).toThrow('Mission 64 branch 0 is not completable');

    expect(player.completedMissions).toHaveLength(1);
    expect(
      game.missionTracker.getMissionState(player.id, '64'),
    ).toBeUndefined();
  });
});
