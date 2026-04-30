import { AlteredTrajectory } from '../alien/AlteredTrajectoryCard.js';
import { AmazingUncertaintyCard } from '../alien/AmazingUncertaintyCard.js';
import { AreWeBeingObservedCard } from '../alien/AreWeBeingObservedCard.js';
import { CloseUpViewCard } from '../alien/CloseUpViewCard.js';
import { ExcavationRover } from '../alien/ExcavationRoverCard.js';
import { ExofossilDiscovery } from '../alien/ExofossilDiscoveryCard.js';
import { ExofossilSamples } from '../alien/ExofossilSamplesCard.js';
import { FloodingTheMediaSpaceCard } from '../alien/FloodingTheMediaSpaceCard.js';
import { ListeningCarefullyCard } from '../alien/ListeningCarefullyCard.js';
import { PartOfEverydayLifeCard } from '../alien/PartOfEverydayLifeCard.js';
import { PerfectTiming } from '../alien/PerfectTimingCard.js';
import { ProbeCustomisation } from '../alien/ProbeCustomisationCard.js';
import { SignsOfLifeCard } from '../alien/SignsOfLifeCard.js';
import { TerrainMapping } from '../alien/TerrainMappingCard.js';
import { VisitorInTheSky } from '../alien/VisitorInTheSkyCard.js';
import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

function g(registry: CardRegistry, id: string): void {
  registry.register(id, () => createGenericCard(loadCardData(id)));
}

/**
 * Alien cards are registered through generic card metadata plus DESC handlers
 * for species-specific behavior.
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
  registry.register('ET.11', () => new SignsOfLifeCard()); // Signs of Life              | LAUNCH, DESC
  registry.register('ET.12', () => new CloseUpViewCard()); // Close-up View              | MOVE(5), DESC
  registry.register('ET.14', () => new ListeningCarefullyCard()); // Listening Carefully         | SCAN, DESC
  registry.register('ET.15', () => new PartOfEverydayLifeCard()); // Part of Everyday Life       | CARD(3), DESC
  registry.register('ET.16', () => new FloodingTheMediaSpaceCard()); // Flooding the Media Space    | DESC(special)
  g(registry, 'ET.18'); // Message Capsule             | ROTATE, TECH_ANY
  g(registry, 'ET.19'); // New Physics                 | TRACE_ANY

  // ============================================================
  // ALIEN — mission with DESC
  // ============================================================
  g(registry, 'ET.13'); // Concerned People            | PUBLICITY, FM
  registry.register('ET.17', () => new AreWeBeingObservedCard()); // Are we Being Observed?      | DESC, QM

  // ============================================================
  // ALIEN — signal/scan group
  // ============================================================
  registry.register('ET.20', () => new AmazingUncertaintyCard()); // Amazing Uncertainty         | ANY_SIGNAL, DESC, DESC
  registry.register('ET.21', () => new VisitorInTheSky()); // Visitor in the Sky          | SCAN, DESC, QM
  registry.register('ET.22', () => new AlteredTrajectory()); // Altered Trajectory          | SCAN, DESC, QM
  registry.register('ET.23', () => new ExofossilDiscovery()); // Exofossil Discovery         | ANY_SIGNAL, DESC, QM

  // ============================================================
  // ALIEN — endgame + signal/observation
  // ============================================================
  registry.register('ET.24', () => new TerrainMapping()); // Terrain Mapping             | 3-color signals, DESC, EG

  // ============================================================
  // ALIEN — probe/land + special
  // ============================================================
  registry.register('ET.25', () => new ProbeCustomisation()); // Probe Customisation         | DESC, LAND
  g(registry, 'ET.26'); // Race Against Time           | LAUNCH, EXOFOSSIL
  registry.register('ET.27', () => new PerfectTiming()); // Perfect Timing              | MOVE(4), DESC, QM
  registry.register('ET.28', () => new ExofossilSamples()); // Exofossil Samples           | ROTATE, TECH_COMPUTER, DESC
  g(registry, 'ET.29'); // Comparative Analysis        | EXOFOSSIL, FM
  registry.register('ET.30', () => new ExcavationRover()); // Excavation Rover            | LAND, DESC, QM

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
