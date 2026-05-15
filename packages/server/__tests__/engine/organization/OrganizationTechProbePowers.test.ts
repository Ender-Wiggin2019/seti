import { ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { UseOrganizationPowerFreeAction } from '@/engine/freeActions/UseOrganizationPower.js';
import { Game } from '@/engine/Game.js';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';
import { HelionAssembly } from '@/engine/organization/organizations/HelionAssembly.js';
import { OrbitalDynamics } from '@/engine/organization/organizations/OrbitalDynamics.js';
import { TuringSystems } from '@/engine/organization/organizations/TuringSystems.js';
import { TechModifierQuery } from '@/engine/tech/TechModifierQuery.js';
import { skipSetupTucks } from '../../helpers/TestGameBuilder.js';

function createCleanGame() {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'organization-tech-probe-powers-seed',
  );
  skipSetupTucks(game);
  return game;
}

describe('technology and probe oriented organization powers', () => {
  function chooseNextDeferredOption(game: Game, optionId: string): void {
    const input = game.deferredActions.drain(game);
    expect(input?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
    });
    const done = input?.process({
      type: EPlayerInputType.OPTION,
      optionId,
    });
    expect(done).toBeUndefined();
  }

  it('Orbital Dynamics raises probe space capacity and moves two different probes', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const organization = new OrbitalDynamics();

    organization.resolve(player, game);
    organization.restore(player, game);

    expect(player.probeSpaceLimit).toBe(2);
    const firstInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.ORBITAL_DYNAMICS,
    );
    expect(firstInput?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
    });

    const firstModel = firstInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    const firstOption = firstModel?.options[0];
    expect(firstOption).toBeDefined();
    const [firstProbeId, firstTargetId] = firstOption?.id.split(':') ?? [];

    const secondInput = firstInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: firstOption?.id ?? '',
    });

    expect(game.solarSystem?.findProbe(firstProbeId)?.space.id).toBe(
      firstTargetId,
    );
    expect(secondInput?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
    });

    const secondModel = secondInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    const secondOption = secondModel?.options.find(
      (option) => option.id !== 'done',
    );
    expect(secondOption).toBeDefined();
    const [secondProbeId, secondTargetId] = secondOption?.id.split(':') ?? [];
    expect(secondProbeId).not.toBe(firstProbeId);

    const done = secondInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: secondOption?.id ?? '',
    });

    expect(done).toBeUndefined();
    expect(game.solarSystem?.findProbe(secondProbeId)?.space.id).toBe(
      secondTargetId,
    );
    expect(player.oncePerRoundUsed[EOrganizationId.ORBITAL_DYNAMICS]).toBe(
      true,
    );
  });

  it('Helion Assembly rewards first acquired tech category marks once', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const organization = new HelionAssembly();
    player.organizationIds = [EOrganizationId.HELION_ASSEMBLY];
    const startEnergy = player.resources.energy;
    const startSignalTokens = player.resources.signalTokens;
    const startData = player.resources.data;

    organization.restore(player, game);
    organization.restore(player, game);
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.PROBE_DOUBLE_PROBE,
      techCategory: ETech.PROBE,
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.PROBE_ASTEROID,
      techCategory: ETech.PROBE,
    });
    chooseNextDeferredOption(game, 'mark');
    expect(game.deferredActions.drain(game)).toBeUndefined();
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.SCAN_EARTH_LOOK,
      techCategory: ETech.SCAN,
    });
    chooseNextDeferredOption(game, 'mark');
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.COMPUTER_VP_CREDIT,
      techCategory: ETech.COMPUTER,
    });
    chooseNextDeferredOption(game, 'mark');

    expect(player.resources.energy).toBe(startEnergy + 1);
    expect(player.resources.signalTokens).toBe(startSignalTokens + 1);
    expect(player.resources.data).toBe(startData + 1);
  });

  it('Helion Assembly disables a selected probe or scan tech until removed from effective modifiers', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const organization = new HelionAssembly();
    player.organizationIds = [EOrganizationId.HELION_ASSEMBLY];
    player.oncePerRoundUsed = { [EOrganizationId.HELION_ASSEMBLY]: false };
    player.techs = [
      ETechId.PROBE_DOUBLE_PROBE,
      ETechId.SCAN_EARTH_LOOK,
      ETechId.COMPUTER_VP_CREDIT,
    ];
    player.hand = ['128'];

    organization.restore(player, game);
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.PROBE_DOUBLE_PROBE,
      techCategory: ETech.PROBE,
    });
    chooseNextDeferredOption(game, 'mark');

    const techInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.HELION_ASSEMBLY,
    );
    const tuckInput = techInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_DOUBLE_PROBE,
    });
    const done = tuckInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['128'],
    });

    const effectiveTechIds = organization.getEffectiveTechIds(
      player,
      game,
      player.techs,
    );

    expect(done).toBeUndefined();
    expect(player.techs).toContain(ETechId.PROBE_DOUBLE_PROBE);
    expect(effectiveTechIds).toEqual([
      ETechId.SCAN_EARTH_LOOK,
      ETechId.COMPUTER_VP_CREDIT,
    ]);
    expect(
      TechModifierQuery.fromTechIds(effectiveTechIds).getProbeSpaceLimit(1),
    ).toBe(1);
    expect(player.tuckedIncomeCards).toEqual(['128']);
    expect(player.organizationState[EOrganizationId.HELION_ASSEMBLY]).toEqual({
      disabledTechIds: [ETechId.PROBE_DOUBLE_PROBE],
      markedCategories: [],
      pendingCategories: [],
    });
  });

  it('Turing Systems grants publicity for computer tech acquisitions', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const organization = new TuringSystems();
    player.organizationIds = [EOrganizationId.TURING_SYSTEMS];
    const startPublicity = player.resources.publicity;

    organization.restore(player, game);
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.COMPUTER_VP_CREDIT,
      techCategory: ETech.COMPUTER,
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.PROBE_DOUBLE_PROBE,
      techCategory: ETech.PROBE,
    });

    expect(player.resources.publicity).toBe(startPublicity + 1);
  });

  it('Turing Systems adds a temporary probe or scan tech to effective ids until turn end', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const organization = new TuringSystems();
    player.organizationIds = [EOrganizationId.TURING_SYSTEMS];
    player.oncePerRoundUsed = { [EOrganizationId.TURING_SYSTEMS]: false };
    player.techs = [];

    organization.restore(player, game);
    const input = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.TURING_SYSTEMS,
    );
    const done = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_DOUBLE_PROBE,
    });

    const effectiveTechIds = organization.getEffectiveTechIds(
      player,
      game,
      player.techs,
    );

    expect(done).toBeUndefined();
    expect(player.techs).toEqual([]);
    expect(effectiveTechIds).toEqual([ETechId.PROBE_DOUBLE_PROBE]);
    expect(
      TechModifierQuery.fromTechIds(effectiveTechIds).getProbeSpaceLimit(1),
    ).toBe(2);

    game.eventBus.emit({
      type: EGameRuntimeEvent.TURN_END,
      game,
      playerId: player.id,
    });

    expect(
      organization.getEffectiveTechIds(player, game, player.techs),
    ).toEqual([]);
  });

  it('composes Helion and Turing event listeners and effective tech modifiers without duplicate restore rewards', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const other = game.players[1];
    player.organizationIds = [
      EOrganizationId.HELION_ASSEMBLY,
      EOrganizationId.TURING_SYSTEMS,
    ];
    player.organizationState = {
      [EOrganizationId.HELION_ASSEMBLY]: {
        disabledTechIds: [ETechId.PROBE_DOUBLE_PROBE],
      },
      [EOrganizationId.TURING_SYSTEMS]: {
        temporaryTechId: ETechId.SCAN_EARTH_LOOK,
      },
    };
    player.techs = [ETechId.PROBE_DOUBLE_PROBE];
    const startData = player.resources.data;
    const startPublicity = player.resources.publicity;

    OrganizationRegistry.restorePlayerOrganizations(game, player);
    OrganizationRegistry.restorePlayerOrganizations(game, player);
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player,
      techId: ETechId.COMPUTER_VP_CREDIT,
      techCategory: ETech.COMPUTER,
    });
    chooseNextDeferredOption(game, 'mark');
    game.eventBus.emit({
      type: EGameRuntimeEvent.TECH_ACQUIRED,
      game,
      player: other,
      techId: ETechId.COMPUTER_VP_ENERGY,
      techCategory: ETech.COMPUTER,
    });
    expect(game.deferredActions.drain(game)).toBeUndefined();

    expect(player.resources.data).toBe(startData + 1);
    expect(player.resources.publicity).toBe(startPublicity + 1);
    expect(OrganizationRegistry.getEffectiveTechIds(player, game)).toEqual([
      ETechId.SCAN_EARTH_LOOK,
    ]);
  });
});
