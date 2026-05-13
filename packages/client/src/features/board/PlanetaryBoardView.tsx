import {
  type IPlanetaryBoardConfig,
  PLANETARY_BOARD_CONFIG,
  PLANETARY_BOARD_DIMENSIONS,
  PLANETARY_PLANETS,
} from '@seti/common/constant/boardLayout';
import {
  canLandOnMoon,
  canLandOnPlanet,
  canOrbitPlanet,
} from '@seti/common/rules';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicGameState,
  IPublicMoonOccupantState,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
} from '@/types/re-exports';
import { EMainAction, EPlanet, EPlayerInputType } from '@/types/re-exports';
import { PlanetCard } from './PlanetCard';

function createEmptyPlanetState(
  config: IPlanetaryBoardConfig,
): IPublicPlanetState {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: Array.from(
      { length: config.land.firstData.length },
      () => false,
    ),
    moonOccupants: [],
  };
}

function getPlanetConfig(
  planetaryBoard: IPublicPlanetaryBoard,
  planet: EPlanet,
): IPlanetaryBoardConfig {
  return (
    planetaryBoard.configs?.[planet] ??
    PLANETARY_BOARD_CONFIG[planet as keyof typeof PLANETARY_BOARD_CONFIG]
  );
}

interface IPlanetaryBoardViewProps {
  planetaryBoard: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  pendingInput: IPlayerInputModel | null;
  playerColors: Record<string, string>;
  mainActionPlanetMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
  onRespondInput?: (response: IInputResponse) => void;
}

function TokenAtPoint({
  x,
  y,
  playerId,
  playerColors,
  title,
}: {
  x: number;
  y: number;
  playerId: string;
  playerColors: Record<string, string>;
  title: string;
}): React.JSX.Element {
  return (
    <span
      className='absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-200/80 shadow-[0_0_8px_rgba(0,0,0,0.45)]'
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: playerColors[playerId] ?? '#cbd5e1',
      }}
      title={title}
      aria-label={`planet-board-token-${playerId}`}
    />
  );
}

type TPlanetHotspotKind = 'orbit' | 'planet-land' | 'moon-land';

interface IPlanetHotspot {
  kind: TPlanetHotspotKind;
  index: number;
  moonId?: string;
  moonName?: string;
  x: number;
  y: number;
}

function getMoonOccupants(
  state: IPublicPlanetState,
): IPublicMoonOccupantState[] {
  return state.moonOccupants;
}

function getPlanetHotspots(
  config: IPlanetaryBoardConfig,
  mode: EMainAction.ORBIT | EMainAction.LAND | null,
): IPlanetHotspot[] {
  const includeOrbit = mode !== EMainAction.LAND;
  const includeLanding = mode !== EMainAction.ORBIT;
  const hotspots: IPlanetHotspot[] = [];

  if (includeOrbit) {
    hotspots.push(
      ...config.orbitSlots.map((slot, index) => ({
        kind: 'orbit' as const,
        index,
        x: slot.x,
        y: slot.y,
      })),
    );
  }

  if (includeLanding) {
    let moonOrdinal = 0;
    hotspots.push(
      ...config.landingSlots.map((slot, index) => {
        const isMoon = config.landingSlotKinds[index] === 'moon';
        const moonId = isMoon ? config.moonIds[moonOrdinal] : undefined;
        const hotspot = {
          kind: isMoon ? ('moon-land' as const) : ('planet-land' as const),
          index,
          moonId,
          moonName: isMoon ? config.moonNames[moonOrdinal] : undefined,
          x: slot.x,
          y: slot.y,
        };
        if (isMoon) {
          moonOrdinal += 1;
        }
        return hotspot;
      }),
    );
  }

  if (hotspots.length > 0) {
    return hotspots;
  }

  return [
    { kind: 'planet-land', index: 0, x: config.anchor.x, y: config.anchor.y },
  ];
}

function canSelectMainActionTarget(
  mode: EMainAction.ORBIT | EMainAction.LAND | null,
  planet: EPlanet,
  planetState: IPublicPlanetState,
  player: IPublicGameState['players'][number] | undefined,
  gameState: IPublicGameState | null,
  options: { isMoon?: boolean; moonId?: string } = {},
): boolean {
  if (!mode || !player || !gameState) return false;

  if (mode === EMainAction.ORBIT) {
    return canOrbitPlanet(planet, planetState, player, gameState);
  }

  if (!canLandOnPlanet(planet, planetState, player, gameState)) {
    return false;
  }

  if (options.isMoon) {
    return (
      canLandOnMoon(planet, planetState, player, options.moonId) &&
      !planetState.moonOccupants.some(
        (occupant) => occupant.playerId === player.playerId,
      )
    );
  }

  return true;
}

export function PlanetaryBoardView({
  planetaryBoard,
  gameState = null,
  myPlayerId,
  pendingInput,
  playerColors,
  mainActionPlanetMode = null,
  onSelectMainActionPlanet,
  onRespondInput,
}: IPlanetaryBoardViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  const selectablePlanets =
    pendingInput?.type === EPlayerInputType.PLANET
      ? new Set(pendingInput.options)
      : new Set<EPlanet>();
  const mainActionPlayer = gameState?.players.find(
    (player) => player.playerId === myPlayerId,
  );

  function handlePlanetSelect(
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ): void {
    if (selectablePlanets.has(planet)) {
      if (pendingInput?.type !== EPlayerInputType.PLANET) return;
      onRespondInput?.({
        inputId: pendingInput.inputId,
        type: EPlayerInputType.PLANET,
        planet,
      });
      return;
    }
    const planetState =
      planetaryBoard.planets[planet] ??
      createEmptyPlanetState(getPlanetConfig(planetaryBoard, planet));
    if (
      canSelectMainActionTarget(
        mainActionPlanetMode,
        planet,
        planetState,
        mainActionPlayer,
        gameState,
        options,
      )
    ) {
      onSelectMainActionPlanet?.(planet, options);
    }
  }

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.board.planetary_board')}
        </h2>
      </header>

      {textMode ? (
        <div
          data-testid='planetary-board-text-cards'
          className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'
        >
          {PLANETARY_PLANETS.map((planet) => {
            const config = getPlanetConfig(planetaryBoard, planet);
            const planetState =
              planetaryBoard.planets[planet] ?? createEmptyPlanetState(config);
            const planetTargetSelectable =
              selectablePlanets.has(planet) ||
              canSelectMainActionTarget(
                mainActionPlanetMode,
                planet,
                planetState,
                mainActionPlayer,
                gameState,
              );
            const selectableMoonIds =
              mainActionPlanetMode === EMainAction.LAND
                ? new Set(
                    config.moonIds.filter((moonId) =>
                      canSelectMainActionTarget(
                        mainActionPlanetMode,
                        planet,
                        planetState,
                        mainActionPlayer,
                        gameState,
                        { isMoon: true, moonId },
                      ),
                    ),
                  )
                : new Set<string>();
            return (
              <PlanetCard
                key={planet}
                planet={planet}
                config={config}
                state={planetState}
                playerColors={playerColors}
                isSelectable={
                  planetTargetSelectable || selectableMoonIds.size > 0
                }
                onSelect={
                  planetTargetSelectable
                    ? () => handlePlanetSelect(planet)
                    : undefined
                }
                selectableMoonIds={selectableMoonIds}
                onSelectMoon={(moonId) =>
                  handlePlanetSelect(planet, { isMoon: true, moonId })
                }
              />
            );
          })}
        </div>
      ) : (
        <div className='rounded-md border border-surface-700/50 bg-surface-950/40 p-3'>
          <div className='relative mx-auto w-full max-w-[520px] overflow-hidden rounded-md border border-surface-700/50'>
            <div
              data-testid='planetary-board-image-mode'
              className='relative w-full bg-cover bg-center'
              style={{
                aspectRatio: `${PLANETARY_BOARD_DIMENSIONS.width} / ${PLANETARY_BOARD_DIMENSIONS.height}`,
                backgroundImage: 'url(/assets/seti/boards/planetBoard.jpg)',
                backgroundSize: '100% 100%',
              }}
            >
              {PLANETARY_PLANETS.map((planet) => {
                const config = getPlanetConfig(planetaryBoard, planet);
                const planetState =
                  planetaryBoard.planets[planet] ??
                  createEmptyPlanetState(config);
                const moonOccupants = getMoonOccupants(planetState);
                const hotspots = getPlanetHotspots(
                  config,
                  mainActionPlanetMode,
                ).filter((hotspot) => {
                  if (selectablePlanets.has(planet)) {
                    return true;
                  }
                  return canSelectMainActionTarget(
                    mainActionPlanetMode,
                    planet,
                    planetState,
                    mainActionPlayer,
                    gameState,
                    hotspot.kind === 'moon-land'
                      ? { isMoon: true, moonId: hotspot.moonId }
                      : {},
                  );
                });

                return (
                  <div key={`planet-overlay-${planet}`}>
                    {hotspots.map((hotspot, index) => {
                      const isMoonTarget = hotspot.kind === 'moon-land';
                      const moonLabel =
                        hotspot.moonName ?? hotspot.moonId ?? 'moon';
                      const targetLabel = isMoonTarget
                        ? `${config.label} ${moonLabel}`
                        : `${config.label} ${hotspot.kind}`;
                      return (
                        <button
                          key={`${planet}-target-${hotspot.kind}-${hotspot.index}`}
                          type='button'
                          data-testid={
                            isMoonTarget
                              ? `planet-target-${planet}-moon-${hotspot.moonId}`
                              : index === 0
                                ? `planet-target-${planet}`
                                : `planet-target-${planet}-${hotspot.kind}-${hotspot.index}`
                          }
                          className={cn(
                            'absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-400/80 bg-accent-500/10 ring-1 ring-accent-400/70',
                            'hover:bg-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300',
                          )}
                          style={{
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                          }}
                          onClick={() =>
                            handlePlanetSelect(
                              planet,
                              isMoonTarget
                                ? {
                                    isMoon: true,
                                    moonId: hotspot.moonId,
                                  }
                                : undefined,
                            )
                          }
                          aria-label={`${targetLabel} target`}
                          title={targetLabel}
                        />
                      );
                    })}

                    {config.orbitSlots.map((slot, index) => {
                      const occupied = planetState.orbitSlots[index];
                      if (!occupied) return null;
                      return (
                        <TokenAtPoint
                          key={`${planet}-orbit-token-${index}`}
                          x={slot.x}
                          y={slot.y}
                          playerId={occupied.playerId}
                          playerColors={playerColors}
                          title={`${config.label} orbit (${occupied.playerId})`}
                        />
                      );
                    })}

                    {config.landingSlots.map((slot, index) => {
                      const slotKind =
                        config.landingSlotKinds[index] ?? 'planet';
                      const planetSlotOrdinal =
                        config.landingSlotKinds
                          .slice(0, index + 1)
                          .filter((kind) => kind === 'planet').length - 1;
                      const moonSlotOrdinal =
                        config.landingSlotKinds
                          .slice(0, index + 1)
                          .filter((kind) => kind === 'moon').length - 1;
                      const moonId = config.moonIds[moonSlotOrdinal];
                      const token =
                        slotKind === 'planet'
                          ? planetState.landingSlots[planetSlotOrdinal]
                          : moonOccupants.find(
                              (occupant) => occupant.moonId === moonId,
                            );

                      if (!token) return null;
                      return (
                        <TokenAtPoint
                          key={`${planet}-landing-token-${index}`}
                          x={slot.x}
                          y={slot.y}
                          playerId={token.playerId}
                          playerColors={playerColors}
                          title={`${config.label} ${slotKind} (${token.playerId})`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
