import type { IComputerSlotReward } from '@seti/common/types/computer';
import { EMainAction } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId, RESEARCH_PUBLICITY_COST } from '@seti/common/types/tech';
import { AnalyzeDataAction } from '@/engine/actions/AnalyzeData.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import { Game } from '@/engine/Game.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import type { Player } from '@/engine/player/Player.js';
import {
  ComputerVpCardTech,
  ComputerVpCreditTech,
  ComputerVpEnergyTech,
  ComputerVpPublicityTech,
} from '@/engine/tech/techs/ComputerTechs.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

describe('Computer tech slot rewards (class-level)', () => {
  it('comp-0: top slot +2VP, bottom slot +1 credit', () => {
    const tech = new ComputerVpCreditTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_CREDIT);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      credits: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-1: top slot +2VP, bottom slot +1 energy', () => {
    const tech = new ComputerVpEnergyTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_ENERGY);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      energy: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-2: top slot +2VP, bottom slot draw 1 card', () => {
    const tech = new ComputerVpCardTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_CARD);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      drawCard: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-3: top slot +2VP, bottom slot +2 publicity', () => {
    const tech = new ComputerVpPublicityTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_PUBLICITY);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      publicity: 2,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('all computer techs share 2VP top-slot reward', () => {
    const techs = [
      new ComputerVpCreditTech(),
      new ComputerVpEnergyTech(),
      new ComputerVpCardTech(),
      new ComputerVpPublicityTech(),
    ];
    for (const tech of techs) {
      expect(tech.getComputerSlotReward(0)).toEqual({ vp: 2 });
    }
  });
});

const INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): { game: Game; player: Player } {
  const game = Game.create(INTEGRATION_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players.find((p) => p.id === 'p1') as Player;
  return { game, player };
}

function getWaitingOptionModel(player: Player): ISelectOptionInputModel {
  if (!player.waitingFor) {
    throw new Error('expected player to be waiting for input');
  }
  return player.waitingFor.toModel() as ISelectOptionInputModel;
}

describe('Phase 8.3: Blue Computer tech — integration (real Game + Place Data)', () => {
  it('8.3.0 [integration] num=0: place data top → +2 VP; bottom → +1 credit', () => {
    const { game, player } = createIntegrationGame('phase-8-3-0-comp-credit');
    player.computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });

    const scoreBefore = player.score;
    const creditsBefore = player.resources.credits;

    player.dataPool.add(1);
    const resultTop = PlaceDataFreeAction.execute(player, game);
    expect(resultTop.row).toBe('top');
    expect(resultTop.index).toBe(0);
    expect(resultTop.reward).toEqual<IComputerSlotReward>({ vp: 2 });
    expect(player.score).toBe(scoreBefore + 2);

    player.dataPool.add(5);
    for (let i = 1; i < 6; i += 1) {
      PlaceDataFreeAction.execute(player, game);
    }

    player.dataPool.add(1);
    const resultBottom = PlaceDataFreeAction.execute(player, game, 0);
    expect(resultBottom.row).toBe('bottom');
    expect(resultBottom.index).toBe(0);
    expect(resultBottom.reward).toEqual<IComputerSlotReward>({ credits: 1 });
    expect(player.resources.credits).toBe(creditsBefore + 1);
  });

  it('8.3.1 [integration] num=1: top → +2 VP; bottom → +1 energy', () => {
    const { game, player } = createIntegrationGame('phase-8-3-1-comp-energy');
    player.computer.placeTech(2, {
      techId: ETechId.COMPUTER_VP_ENERGY,
      bottomReward: { energy: 1 },
    });

    const scoreBefore = player.score;
    const energyBefore = player.resources.energy;

    player.dataPool.add(3);
    PlaceDataFreeAction.execute(player, game);
    PlaceDataFreeAction.execute(player, game);

    const resultTop2 = PlaceDataFreeAction.execute(player, game);
    expect(resultTop2.row).toBe('top');
    expect(resultTop2.index).toBe(2);
    expect(resultTop2.reward).toEqual<IComputerSlotReward>({ vp: 2 });
    expect(player.score).toBe(scoreBefore + 2);

    player.dataPool.add(4);
    for (let i = 3; i < 6; i += 1) {
      PlaceDataFreeAction.execute(player, game);
    }

    player.dataPool.add(1);
    const resultBottom = PlaceDataFreeAction.execute(player, game, 2);
    expect(resultBottom.row).toBe('bottom');
    expect(resultBottom.index).toBe(2);
    expect(resultBottom.reward).toEqual<IComputerSlotReward>({ energy: 1 });
    expect(player.resources.energy).toBe(energyBefore + 1);
  });

  it('8.3.2 [integration] num=2: top → +2 VP; bottom → draw 1 card', () => {
    const { game, player } = createIntegrationGame('phase-8-3-2-comp-card');
    player.computer.placeTech(4, {
      techId: ETechId.COMPUTER_VP_CARD,
      bottomReward: { drawCard: 1 },
    });

    const scoreBefore = player.score;

    player.dataPool.add(5);
    for (let i = 0; i < 4; i += 1) {
      PlaceDataFreeAction.execute(player, game);
    }

    const resultTop4 = PlaceDataFreeAction.execute(player, game);
    expect(resultTop4.row).toBe('top');
    expect(resultTop4.index).toBe(4);
    expect(resultTop4.reward).toEqual<IComputerSlotReward>({ vp: 2 });
    expect(player.score).toBe(scoreBefore + 2);

    player.dataPool.add(2);
    PlaceDataFreeAction.execute(player, game);

    const handBefore = player.hand.length;
    const deckBefore = game.mainDeck.drawSize;

    const resultBottom = PlaceDataFreeAction.execute(player, game, 4);
    expect(resultBottom.row).toBe('bottom');
    expect(resultBottom.index).toBe(4);
    expect(resultBottom.reward).toEqual<IComputerSlotReward>({ drawCard: 1 });
    expect(player.hand.length).toBe(handBefore + 1);
    expect(game.mainDeck.drawSize).toBe(deckBefore - 1);
  });

  it('8.3.3 [integration] num=3: top → +2 VP; bottom → +2 publicity', () => {
    const { game, player } = createIntegrationGame('phase-8-3-3-comp-pub');
    player.computer.placeTech(5, {
      techId: ETechId.COMPUTER_VP_PUBLICITY,
      bottomReward: { publicity: 2 },
    });

    const scoreBefore = player.score;

    player.dataPool.add(6);
    for (let i = 0; i < 5; i += 1) {
      PlaceDataFreeAction.execute(player, game);
    }

    const resultTop5 = PlaceDataFreeAction.execute(player, game);
    expect(resultTop5.row).toBe('top');
    expect(resultTop5.index).toBe(5);
    expect(resultTop5.reward).toEqual<IComputerSlotReward>({ vp: 2 });
    expect(player.score).toBe(scoreBefore + 2);

    const publicityBeforeBottom = player.resources.publicity;

    player.dataPool.add(1);
    const resultBottom = PlaceDataFreeAction.execute(player, game, 5);
    expect(resultBottom.row).toBe('bottom');
    expect(resultBottom.index).toBe(5);
    expect(resultBottom.reward).toEqual<IComputerSlotReward>({ publicity: 2 });
    expect(player.resources.publicity).toBe(publicityBeforeBottom + 2);
  });

  it('8.3.4 [integration] cannot place in bottom slot before top in the same column', () => {
    const { game, player } = createIntegrationGame(
      'phase-8-3-4-top-before-bottom',
    );
    player.computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });

    expect(() =>
      player.computer.placeData({ row: EComputerRow.BOTTOM, index: 0 }),
    ).toThrow(/Top slot must be filled before placing in bottom slot/i);
  });

  it('8.3.5 [integration] Analyze Data clears all top and bottom data; tech tile remains', () => {
    const { game, player } = createIntegrationGame(
      'phase-8-3-5-analyze-clears',
    );
    player.computer.placeTech(0, {
      techId: ETechId.COMPUTER_VP_CREDIT,
      bottomReward: { credits: 1 },
    });

    player.dataPool.add(10);
    for (let i = 0; i < 6; i += 1) {
      PlaceDataFreeAction.execute(player, game);
    }
    player.dataPool.add(1);
    PlaceDataFreeAction.execute(player, game, 0);

    expect(player.computer.getPlacedCount()).toBe(7);
    expect(player.computer.getColumnState(0).bottomFilled).toBe(true);

    expect(AnalyzeDataAction.canExecute(player, game)).toBe(true);
    AnalyzeDataAction.execute(player, game);

    expect(player.computer.getPlacedCount()).toBe(0);
    expect(player.computer.getTopSlots().every((filled) => !filled)).toBe(true);
    expect(player.computer.getBottomSlotStates()[0]).toBe(false);
    const col0 = player.computer.getColumnState(0);
    expect(col0.techId).toBe(ETechId.COMPUTER_VP_CREDIT);
    expect(col0.hasBottomSlot).toBe(true);
  });

  it('8.3.6 [integration] FAQ: blue computer tech can be placed on any eligible column', () => {
    const { game, player } = createIntegrationGame('phase-8-3-6-any-slot');
    player.resources.gain({ publicity: RESEARCH_PUBLICITY_COST });

    game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });

    const techPick = getWaitingOptionModel(player);
    const computerOption = techPick.options.find(
      (o) => o.id === ETechId.COMPUTER_VP_CREDIT,
    );
    if (!computerOption) {
      throw new Error('expected COMPUTER_VP_CREDIT in research options');
    }

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: computerOption.id,
    });

    const columnPick = getWaitingOptionModel(player);
    const columnIds = columnPick.options.map((o) => o.id);
    expect(columnIds.some((id) => id.startsWith('col-'))).toBe(true);
    expect(columnIds).toContain('col-4');

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: 'col-4',
    });

    expect(player.computer.getColumnState(4).techId).toBe(
      ETechId.COMPUTER_VP_CREDIT,
    );
    expect(player.computer.getColumnState(4).hasBottomSlot).toBe(true);
    expect(player.computer.getColumnState(4).topFilled).toBe(false);
  });
});
