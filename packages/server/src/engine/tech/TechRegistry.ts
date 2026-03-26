import { ALL_TECH_IDS, type ETechId } from '@seti/common/types/tech';
import type { ITech } from './ITech.js';
import {
  ComputerVpCardTech,
  ComputerVpCreditTech,
  ComputerVpEnergyTech,
  ComputerVpPublicityTech,
} from './techs/ComputerTechs.js';
import {
  ProbeAsteroidTech,
  ProbeDoubleProbeTech,
  ProbeMoonTech,
  ProbeRoverDiscountTech,
} from './techs/ProbeTechs.js';
import {
  ScanEarthLookTech,
  ScanEnergyLaunchTech,
  ScanHandSignalTech,
  ScanPopSignalTech,
} from './techs/ScanTechs.js';

type TTechFactory = () => ITech;

const TECH_FACTORIES: Record<ETechId, TTechFactory> = {
  'probe-0': () => new ProbeDoubleProbeTech(),
  'probe-1': () => new ProbeAsteroidTech(),
  'probe-2': () => new ProbeRoverDiscountTech(),
  'probe-3': () => new ProbeMoonTech(),
  'scan-0': () => new ScanEarthLookTech(),
  'scan-1': () => new ScanPopSignalTech(),
  'scan-2': () => new ScanHandSignalTech(),
  'scan-3': () => new ScanEnergyLaunchTech(),
  'comp-0': () => new ComputerVpCreditTech(),
  'comp-1': () => new ComputerVpEnergyTech(),
  'comp-2': () => new ComputerVpCardTech(),
  'comp-3': () => new ComputerVpPublicityTech(),
};

/**
 * Creates a fresh ITech instance for the given tech ID.
 * Each call returns a new instance (techs may carry per-player mutable state in the future).
 */
export function createTech(techId: ETechId): ITech {
  const factory = TECH_FACTORIES[techId];
  if (!factory) {
    throw new Error(`Unknown tech id: ${techId}`);
  }
  return factory();
}

/** Creates one instance of every tech, keyed by ID. Used for TechBoard initialization. */
export function createAllTechs(): Map<ETechId, ITech> {
  const techs = new Map<ETechId, ITech>();
  for (const techId of ALL_TECH_IDS) {
    techs.set(techId, createTech(techId));
  }
  return techs;
}
