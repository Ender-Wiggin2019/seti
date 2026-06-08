/**
 * Global game-page layer contract.
 *
 * Board internals must live in isolated stacking contexts so probes, data
 * pills, hotspots, and debug labels never compete with these page layers.
 */
export const GAME_Z_INDEX = {
  background: -10,
  board: 0,
  chrome: 100,
  hand: 200,
  popover: 300,
  pendingInput: 500,
  overlay: 900,
  dialog: 1000,
  toast: 1100,
} as const;

export const BOARD_LOCAL_Z_INDEX = {
  hotspot: 70,
} as const;

/**
 * Local solar-system layering. These values are meaningful only inside the
 * isolated solar board frame.
 */
export const SOLAR_SYSTEM_Z_INDEX = {
  outerWheel: 10,
  thirdWheel: 20,
  secondWheel: 30,
  innerWheel: 40,
  sun: 50,
  sectorContent: 60,
  textLabelBase: 72,
  boardAccessory: 78,
  sectorToken: 79,
  probe: 80,
  dataPill: 86,
  interaction: 90,
  debug: 90,
} as const;
