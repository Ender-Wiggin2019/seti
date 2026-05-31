import { DescRender } from '@seti/cards';
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
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicGameState,
  IPublicMoonOccupantState,
  IPublicPlanetAlienToken,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
} from '@/types/re-exports';
import { EMainAction, EPlanet, EPlayerInputType } from '@/types/re-exports';
import { PlanetCard } from './PlanetCard';
import { ProbeToken } from './ProbeToken';

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
  hotspotId,
}: {
  x: number;
  y: number;
  playerId: string;
  playerColors: Record<string, string>;
  title: string;
  hotspotId: string;
}): React.JSX.Element {
  // Image-mode planetary board uses the printed probe asset for
  // orbit / landing markers — visual continuity with the solar
  // system pawn that gets consumed when the player clicks ORBIT or
  // LAND. The `aria-label` and the colored-circle border around the
  // probe sprite stay so existing tests (`planet-board-token-*`)
  // still locate the marker.
  const playerColor = playerColors[playerId] ?? 'white';
  return (
    <HotspotAnchor
      sceneId='planet-board'
      hotspotId={hotspotId}
      variant='image'
      baseWidth={PLANETARY_BOARD_DIMENSIONS.width}
      baseHeight={PLANETARY_BOARD_DIMENSIONS.height}
      x={(PLANETARY_BOARD_DIMENSIONS.width * x) / 100}
      y={(PLANETARY_BOARD_DIMENSIONS.height * y) / 100}
      width={28}
      height={28}
      color={playerColor}
      debugLabel={title}
      className='inline-flex items-center justify-center'
      title={title}
      ariaLabel={`planet-board-token-${playerId}`}
    >
      <ProbeToken playerColor={playerColor} className='h-7 w-7' />
    </HotspotAnchor>
  );
}

function GlyphTokenAtPoint({
  x,
  y,
  token,
  hotspotId,
}: {
  x: number;
  y: number;
  token: IPublicPlanetAlienToken;
  hotspotId: string;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const glyphLabel = t('client.planetary_board.glyph_token', {
    glyph: token.glyph,
    defaultValue: `${token.glyph} glyph token`,
  });
  return (
    <HotspotAnchor
      sceneId='planet-board'
      hotspotId={hotspotId}
      variant='image'
      baseWidth={PLANETARY_BOARD_DIMENSIONS.width}
      baseHeight={PLANETARY_BOARD_DIMENSIONS.height}
      x={(PLANETARY_BOARD_DIMENSIONS.width * x) / 100}
      y={(PLANETARY_BOARD_DIMENSIONS.height * y) / 100}
      width={28}
      height={28}
      color='#bef264'
      debugLabel={glyphLabel}
      className='inline-flex items-center justify-center rounded-full'
      testId={`planet-board-alien-token-${token.tokenId}`}
      aria-label={glyphLabel}
      title={glyphLabel}
    >
      <span className='inline-flex h-full w-full items-center justify-center rounded-full border border-lime-300/80 bg-surface-950/80 shadow-[0_0_12px_rgba(190,242,100,0.35)]'>
        <DescRender desc={`{${token.glyph}[sm]}`} size='desc-mini' smartSize />
      </span>
    </HotspotAnchor>
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

interface IPlanetTarget extends IPlanetHotspot {
  hotspotId: string;
  label: string;
  selectOptions?: { isMoon?: boolean; moonId?: string };
}

function getPlanetOrbitHotspotId(planet: EPlanet, index: number): string {
  return `${planet}-orbit-${index}`;
}

function getPlanetLandingHotspotId(
  planet: EPlanet,
  slotKind: 'planet' | 'moon',
  slotIndex: number,
  moonId?: string,
): string {
  if (slotKind === 'moon') {
    return `${planet}-moon-${moonId}`;
  }
  return `${planet}-planet-land-${slotIndex}`;
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

function getPlanetTargets(
  planet: EPlanet,
  config: IPlanetaryBoardConfig,
  mode: EMainAction.ORBIT | EMainAction.LAND | null,
): IPlanetTarget[] {
  return getPlanetHotspots(config, mode).map((hotspot) => {
    const isMoonTarget = hotspot.kind === 'moon-land';
    return {
      ...hotspot,
      hotspotId: isMoonTarget
        ? getPlanetLandingHotspotId(
            planet,
            'moon',
            hotspot.index,
            hotspot.moonId,
          )
        : hotspot.kind === 'orbit'
          ? getPlanetOrbitHotspotId(planet, hotspot.index)
          : getPlanetLandingHotspotId(planet, 'planet', hotspot.index),
      label: isMoonTarget
        ? `${config.label} ${hotspot.moonName ?? hotspot.moonId ?? 'moon'}`
        : `${config.label} ${hotspot.kind}`,
      selectOptions: isMoonTarget
        ? { isMoon: true, moonId: hotspot.moonId }
        : undefined,
    };
  });
}

function getPlanetTargetTestId(
  planet: EPlanet,
  target: IPlanetTarget,
  index: number,
): string {
  if (target.kind === 'moon-land') {
    return `planet-target-${planet}-moon-${target.moonId}`;
  }
  return index === 0
    ? `planet-target-${planet}`
    : `planet-target-${planet}-${target.kind}-${target.index}`;
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
            const planetTargetSelectable = selectablePlanets.has(planet);
            const targets = getPlanetTargets(
              planet,
              config,
              mainActionPlanetMode,
            ).filter((target) => {
              if (planetTargetSelectable) {
                return true;
              }
              return canSelectMainActionTarget(
                mainActionPlanetMode,
                planet,
                planetState,
                mainActionPlayer,
                gameState,
                target.selectOptions ?? {},
              );
            });
            const selectableMoonIds = new Set(
              targets
                .map((target) => target.selectOptions?.moonId)
                .filter((moonId): moonId is string => moonId !== undefined),
            );
            const planetMainActionSelectable = targets.some(
              (target) => target.selectOptions?.isMoon !== true,
            );
            return (
              <PlanetCard
                key={planet}
                planet={planet}
                config={config}
                state={planetState}
                playerColors={playerColors}
                isSelectable={
                  planetTargetSelectable ||
                  planetMainActionSelectable ||
                  selectableMoonIds.size > 0
                }
                onSelect={
                  planetTargetSelectable || planetMainActionSelectable
                    ? () => handlePlanetSelect(planet)
                    : undefined
                }
                selectableMoonIds={selectableMoonIds}
                onSelectMoon={(moonId) =>
                  handlePlanetSelect(planet, { isMoon: true, moonId })
                }
                hotspotTargets={targets.map((target, index) => ({
                  hotspotId: target.hotspotId,
                  testId: getPlanetTargetTestId(planet, target, index),
                  label: target.label,
                  ariaLabel: t('client.planetary_board.target_aria_label', {
                    label: target.label,
                    defaultValue: `${target.label} target`,
                  }),
                  onSelect: () =>
                    handlePlanetSelect(planet, target.selectOptions),
                }))}
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
                backgroundImage: 'url(/assets/seti/boards/planetBoard.webp)',
                backgroundSize: '100% 100%',
              }}
            >
              {PLANETARY_PLANETS.map((planet) => {
                const config = getPlanetConfig(planetaryBoard, planet);
                const planetState =
                  planetaryBoard.planets[planet] ??
                  createEmptyPlanetState(config);
                const moonOccupants = getMoonOccupants(planetState);
                const targets = getPlanetTargets(
                  planet,
                  config,
                  mainActionPlanetMode,
                ).filter((target) => {
                  if (selectablePlanets.has(planet)) {
                    return true;
                  }
                  return canSelectMainActionTarget(
                    mainActionPlanetMode,
                    planet,
                    planetState,
                    mainActionPlayer,
                    gameState,
                    target.selectOptions ?? {},
                  );
                });

                return (
                  <div key={`planet-overlay-${planet}`}>
                    {targets.map((target, index) => {
                      return (
                        <HotspotButton
                          key={`${planet}-target-${target.kind}-${target.index}`}
                          sceneId='planet-board'
                          hotspotId={target.hotspotId}
                          variant='image'
                          baseWidth={PLANETARY_BOARD_DIMENSIONS.width}
                          baseHeight={PLANETARY_BOARD_DIMENSIONS.height}
                          x={
                            (PLANETARY_BOARD_DIMENSIONS.width * target.x) / 100
                          }
                          y={
                            (PLANETARY_BOARD_DIMENSIONS.height * target.y) / 100
                          }
                          width={36}
                          height={36}
                          testId={getPlanetTargetTestId(planet, target, index)}
                          debugLabel={target.label}
                          className={cn(
                            'border-accent-400/80 ring-1 ring-accent-400/70',
                            'hover:bg-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300',
                          )}
                          onClick={() =>
                            handlePlanetSelect(planet, target.selectOptions)
                          }
                          ariaLabel={t(
                            'client.planetary_board.target_aria_label',
                            {
                              label: target.label,
                              defaultValue: `${target.label} target`,
                            },
                          )}
                          title={target.label}
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
                          title={t('client.planetary_board.orbit_token_title', {
                            label: config.label,
                            player: occupied.playerId,
                            defaultValue: `${config.label} orbit (${occupied.playerId})`,
                          })}
                          hotspotId={getPlanetOrbitHotspotId(planet, index)}
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
                          title={t(
                            'client.planetary_board.landing_token_title',
                            {
                              label: config.label,
                              slotKind,
                              player: token.playerId,
                              defaultValue: `${config.label} ${slotKind} (${token.playerId})`,
                            },
                          )}
                          hotspotId={getPlanetLandingHotspotId(
                            planet,
                            slotKind,
                            index,
                            moonId,
                          )}
                        />
                      );
                    })}

                    {(planetState.alienTokens ?? []).map((token, index) => (
                      <GlyphTokenAtPoint
                        key={`${planet}-alien-token-${token.tokenId}`}
                        x={Math.min(config.anchor.x + index * 4, 98)}
                        y={config.anchor.y}
                        token={token}
                        hotspotId={`${planet}-alien-token-${token.tokenId}`}
                      />
                    ))}
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
