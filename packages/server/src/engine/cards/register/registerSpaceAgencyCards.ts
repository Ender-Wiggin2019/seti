import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';
import { AbandonedMission } from '../spaceAgency/AbandonedMissionCard.js';
import { AkatsukuOrbiter } from '../spaceAgency/AkatsukuOrbiterCard.js';
import { BetterSolarPanels } from '../spaceAgency/BetterSolarPanelsCard.js';
import { ContractedResearch } from '../spaceAgency/ContractedResearchCard.js';
import { IterativeEngineering } from '../spaceAgency/IterativeEngineeringCard.js';
import { JamesClerkMaxwellTelescope } from '../spaceAgency/JamesClerkMaxwellTelescopeCard.js';
import { LiveLandingBroadcast } from '../spaceAgency/LiveLandingBroadcastCard.js';
import { MurepIdeaCompetition } from '../spaceAgency/MurepIdeaCompetitionCard.js';
import { NewAssignment } from '../spaceAgency/NewAssignmentCard.js';
import { PaidMediaCoverage } from '../spaceAgency/PaidMediaCoverageCard.js';
import { PandoraSatellite } from '../spaceAgency/PandoraSatelliteCard.js';
import { PrivateSectorInvestment } from '../spaceAgency/PrivateSectorInvestmentCard.js';
import { Restructuring } from '../spaceAgency/RestructuringCard.js';
import { ReusableLander } from '../spaceAgency/ReusableLanderCard.js';
import { ReusableRocket } from '../spaceAgency/ReusableRocketCard.js';
import { SpaceRendezvous } from '../spaceAgency/SpaceRendezvousCard.js';
import { TessSatellite } from '../spaceAgency/TessSatelliteCard.js';
import { TrackingAndDataRelaySatellite } from '../spaceAgency/TrackingAndDataRelaySatelliteCard.js';
import { TwoPlanetFlyby } from '../spaceAgency/TwoPlanetFlybyCard.js';
import { WellExecutedProject } from '../spaceAgency/WellExecutedProjectCard.js';

function g(registry: CardRegistry, id: string): void {
  registry.register(id, () => createGenericCard(loadCardData(id)));
}

export function registerSpaceAgencyCards(registry: CardRegistry): void {
  // ============================================================
  // GENERIC — pure base effects, fully config-driven
  // ============================================================
  g(registry, 'SA.36'); // Big Ear Radio Telescope   | SIGNAL_YELLOW, SIGNAL_RED, SIGNAL_BLUE
  g(registry, 'SA.40'); // Hall-effect Thruster       | MOVE(5)

  // ============================================================
  // IMMEDIATE + DESC — land/launch + special
  // ============================================================
  registry.register('SA.1', () => new ReusableLander()); // Reusable Lander           | LAND, DESC
  registry.register('SA.6', () => new LiveLandingBroadcast()); // Live Landing Broadcast    | MOVE, LAND, DESC
  registry.register('SA.14', () => new ReusableRocket()); // Reusable Rocket           | LAUNCH, PUBLICITY, DESC
  registry.register('SA.30', () => new AkatsukuOrbiter()); // Akatsuku Orbiter          | ORBIT, PUBLICITY, DESC

  // ============================================================
  // IMMEDIATE + DESC — movement + special
  // ============================================================
  g(registry, 'SA.5'); // Servicing Mission         | DATA, MOVE, DESC
  registry.register('SA.12', () => new TwoPlanetFlyby()); // Two-planet Flyby          | MOVE(2), DESC
  registry.register('SA.38', () => new SpaceRendezvous()); // Space Rendezvous          | PUBLICITY, MOVE, DESC

  // ============================================================
  // IMMEDIATE + DESC — tech + special
  // ============================================================
  registry.register('SA.15', () => new IterativeEngineering()); // Iterative Engineering     | ROTATE, TECH_ANY, DESC

  // ============================================================
  // IMMEDIATE + DESC — resource/draw + special
  // ============================================================
  registry.register('SA.2', () => new TrackingAndDataRelaySatellite()); // Tracking & Data Relay     | DESC(special)
  registry.register('SA.17', () => new PaidMediaCoverage()); // Paid Media Coverage       | DESC(special)
  registry.register('SA.19', () => new NewAssignment()); // New Assignment            | DESC(special)
  registry.register('SA.20', () => new WellExecutedProject()); // Well Executed Project     | PUBLICITY, DESC
  registry.register('SA.27', () => new BetterSolarPanels()); // Better Solar Panels       | DESC(special)
  registry.register('SA.29', () => new AbandonedMission()); // Abandoned Mission         | DESC(special)
  registry.register('SA.32', () => new MurepIdeaCompetition()); // MUREP Idea Competition    | DESC, PUBLICITY, CARD(2)
  registry.register('SA.34', () => new PrivateSectorInvestment()); // Private Sector Investment | INCOME, DESC

  // ============================================================
  // IMMEDIATE + DESC — scan/signal
  // ============================================================
  registry.register('SA.13', () => new JamesClerkMaxwellTelescope()); // James Clerk Maxwell Tel   | SCAN, DESC

  // ============================================================
  // IMMEDIATE + DESC — multi-part
  // ============================================================
  registry.register('SA.18', () => new ContractedResearch()); // Contracted Research       | DESC, ROTATE, TECH_ANY, DESC

  // ============================================================
  // IMMEDIATE — signal-token
  // ============================================================
  g(registry, 'SA.3'); // NASA Deep Space Network   | SIGNAL_TOKEN(3)
  g(registry, 'SA.4'); // Breakthrough Message      | SIGNAL_TOKEN, MOVE

  registry.register('SA.22', () => new TessSatellite()); // TESS Satellite            | ANY_SIGNAL(2), DESC
  registry.register('SA.37', () => new PandoraSatellite()); // Pandora Satellite         | ANY_SIGNAL, DESC

  // ============================================================
  // QUICK MISSION — tech + mission
  // ============================================================
  g(registry, 'SA.7'); // Twin Probes               | ROTATE, TECH_PROBE, QM
  g(registry, 'SA.9'); // Lunar Crater Radio Tel    | ROTATE, TECH_SCAN, QM

  // QUICK MISSION — launch + mission
  g(registry, 'SA.11'); // Psyche Probe              | LAUNCH, PUBLICITY, QM

  // QUICK MISSION — resource + mission
  g(registry, 'SA.16'); // Astronaut Training Exp    | PUBLICITY(4), QM
  g(registry, 'SA.42'); // LOFAR Array               | SCAN, QM

  // QUICK MISSION + DESC
  registry.register('SA.28', () => new Restructuring()); // Restructuring             | DESC, QM

  // QUICK MISSION + signal-token
  g(registry, 'SA.35'); // NASA Exoplanet Archive    | SIGNAL_TOKEN, QM
  g(registry, 'SA.41'); // Exoplanet Survey          | SIGNAL_TOKEN, PUBLICITY, CARD_ANY, QM

  // ============================================================
  // FULL MISSION
  // ============================================================
  g(registry, 'SA.21'); // Orbital Refueling         | FM
  g(registry, 'SA.23'); // Neutral Buoyancy Training | PUBLICITY, FM
  g(registry, 'SA.24'); // Space Elevator            | FM
  g(registry, 'SA.25'); // LIGO                      | FM
  g(registry, 'SA.26'); // New AI Models             | FM
  g(registry, 'SA.33'); // Delayed Launch            | PUBLICITY, FM

  // ============================================================
  // END GAME
  // ============================================================
  g(registry, 'SA.8'); // Quantum Data Storage      | ROTATE, TECH_COMPUTER, EG
  g(registry, 'SA.10'); // First Human in Space      | PUBLICITY(10), EG
  g(registry, 'SA.31'); // Ingenuity Helicopter      | LAND, EG
  g(registry, 'SA.39'); // Grand Tour Program        | MOVE(2), EG
}
