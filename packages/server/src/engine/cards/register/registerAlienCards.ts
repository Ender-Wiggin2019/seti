import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

function g(registry: CardRegistry, id: string): void {
  registry.register(id, () => createGenericCard(loadCardData(id)));
}

/**
 * All alien cards require custom implementation.
 * They involve alien-specific mechanics (exofossils, organelles, glyphs, samples, etc.)
 * that are not handled by the base BehaviorExecutor.
 */
export function registerAlienCards(registry: CardRegistry): void {
  // ============================================================
  // ALIEN — sample/pickup group (land/orbit + pickup alien resource)
  // Cards ET.1-7: land/move + pickup alien sample + mission
  // ============================================================
  g(registry, 'ET.1'); // First Contact            | MOVE, LAND, DESC(pickup), QM
  g(registry, 'ET.2'); // Rover Exploration         | LAND, DESC(pickup-moon), QM
  g(registry, 'ET.3'); // Mass Sample Collection    | ORBIT_OR_LAND, DESC(pickup), QM
  g(registry, 'ET.4'); // Martian Quarantine Lab    | LAND, DESC(pickup), QM
  g(registry, 'ET.5'); // Ecosystem Study           | DESC(pickup-back), EG
  g(registry, 'ET.6'); // The Queen                 | LAND, DESC(pickup-moon), QM
  g(registry, 'ET.7'); // Breeding Sample           | LAND, DESC(pickup), QM

  // ============================================================
  // ALIEN — tech + mission (standard tech research + alien mission)
  // ============================================================
  g(registry, 'ET.8'); // Hive Sample               | PUBLICITY, ROTATE, TECH_PROBE, QM
  g(registry, 'ET.9'); // Orbital Monitoring         | PUBLICITY, ROTATE, TECH_SCAN, QM
  g(registry, 'ET.10'); // Computer Simulations       | PUBLICITY, ROTATE, TECH_COMPUTER, QM

  // ============================================================
  // ALIEN — immediate with DESC (alien-specific special effects)
  // ============================================================
  g(registry, 'ET.11'); // Signs of Life              | LAUNCH, DESC
  g(registry, 'ET.12'); // Close-up View              | MOVE(5), DESC
  g(registry, 'ET.14'); // Listening Carefully         | SCAN, DESC
  g(registry, 'ET.15'); // Part of Everyday Life       | CARD(3), DESC
  g(registry, 'ET.16'); // Flooding the Media Space    | DESC(special)
  g(registry, 'ET.18'); // Message Capsule             | ROTATE, TECH_ANY
  g(registry, 'ET.19'); // New Physics                 | TRACE_ANY

  // ============================================================
  // ALIEN — mission with DESC
  // ============================================================
  g(registry, 'ET.13'); // Concerned People            | PUBLICITY, FM
  g(registry, 'ET.17'); // Are we Being Observed?      | DESC, QM

  // ============================================================
  // ALIEN — signal/scan group
  // TODO: UNHANDLED_EFFECT(any-signal)
  // ============================================================
  g(registry, 'ET.20'); // Amazing Uncertainty         | ANY_SIGNAL, DESC, DESC
  g(registry, 'ET.21'); // Visitor in the Sky          | SCAN, DESC, QM
  g(registry, 'ET.22'); // Altered Trajectory          | SCAN, DESC, QM
  g(registry, 'ET.23'); // Exofossil Discovery         | ANY_SIGNAL, DESC, QM

  // ============================================================
  // ALIEN — endgame + signal/observation
  // ============================================================
  g(registry, 'ET.24'); // Terrain Mapping             | 3-color signals, DESC, EG

  // ============================================================
  // ALIEN — probe/land + special
  // ============================================================
  g(registry, 'ET.25'); // Probe Customisation         | DESC, LAND
  // TODO: UNHANDLED_EFFECT(exofossil)
  g(registry, 'ET.26'); // Race Against Time           | LAUNCH, EXOFOSSIL
  g(registry, 'ET.27'); // Perfect Timing              | MOVE(4), DESC, QM
  g(registry, 'ET.28'); // Exofossil Samples           | ROTATE, TECH_COMPUTER, DESC
  // TODO: UNHANDLED_EFFECT(exofossil)
  g(registry, 'ET.29'); // Comparative Analysis        | EXOFOSSIL, FM
  g(registry, 'ET.30'); // Excavation Rover            | LAND, DESC, QM

  // ============================================================
  // ALIEN — advanced tech cards (no effects data, alien-specific)
  // ET.31-40: advanced alien technology cards
  // ============================================================
  g(registry, 'ET.31'); // Vessel Designs
  g(registry, 'ET.32'); // Exocomputers
  g(registry, 'ET.33'); // Infocluster
  g(registry, 'ET.34'); // A Message from Afar
  g(registry, 'ET.35'); // Synthesis Instructions
  g(registry, 'ET.36'); // Alien Schematics
  g(registry, 'ET.37'); // Music of the Spheres
  g(registry, 'ET.38'); // Hivemind Concept
  g(registry, 'ET.39'); // Telescope Blueprints
  g(registry, 'ET.40'); // Torrent-chain Signal

  // ============================================================
  // ALIEN — advanced exoplanet/tech cards (no effects data)
  // ET.41-55: advanced alien constructs
  // ============================================================
  g(registry, 'ET.41'); // Razor-edge Shuttle
  g(registry, 'ET.42'); // Deflector
  g(registry, 'ET.43'); // Expender Core
  g(registry, 'ET.44'); // Pierced Exoplanet
  g(registry, 'ET.45'); // Core-breach Exoplanet
  g(registry, 'ET.46'); // Vortex Exoplanet
  g(registry, 'ET.47'); // Fission-sun Exoplanet
  g(registry, 'ET.48'); // Oscillating Probes
  g(registry, 'ET.49'); // Generative Infrastructure
  g(registry, 'ET.50'); // Casette Deployment
  g(registry, 'ET.51'); // Extractor
  g(registry, 'ET.52'); // Automated Lab
  g(registry, 'ET.53'); // Neuralab
  g(registry, 'ET.54'); // Nanowielder Node
  g(registry, 'ET.55'); // Stratoelevator
}
