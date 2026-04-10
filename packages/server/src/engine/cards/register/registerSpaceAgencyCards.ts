import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

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
  g(registry, 'SA.1'); // Reusable Lander           | LAND, DESC
  g(registry, 'SA.6'); // Live Landing Broadcast    | MOVE, LAND, DESC
  g(registry, 'SA.14'); // Reusable Rocket           | LAUNCH, PUBLICITY, DESC
  g(registry, 'SA.30'); // Akatsuku Orbiter          | ORBIT, PUBLICITY, DESC

  // ============================================================
  // IMMEDIATE + DESC — movement + special
  // ============================================================
  g(registry, 'SA.5'); // Servicing Mission         | DATA, MOVE, DESC
  g(registry, 'SA.12'); // Two-planet Flyby          | MOVE(2), DESC
  g(registry, 'SA.38'); // Space Rendezvous          | PUBLICITY, MOVE, DESC

  // ============================================================
  // IMMEDIATE + DESC — tech + special
  // ============================================================
  g(registry, 'SA.15'); // Iterative Engineering     | ROTATE, TECH_ANY, DESC

  // ============================================================
  // IMMEDIATE + DESC — resource/draw + special
  // ============================================================
  g(registry, 'SA.2'); // Tracking & Data Relay     | DESC(special)
  g(registry, 'SA.17'); // Paid Media Coverage       | DESC(special)
  g(registry, 'SA.19'); // New Assignment            | DESC(special)
  g(registry, 'SA.20'); // Well Executed Project     | PUBLICITY, DESC
  g(registry, 'SA.27'); // Better Solar Panels       | DESC(special)
  g(registry, 'SA.29'); // Abandoned Mission         | DESC(special)
  g(registry, 'SA.32'); // MUREP Idea Competition    | DESC, PUBLICITY, CARD(2)
  g(registry, 'SA.34'); // Private Sector Investment | INCOME, DESC

  // ============================================================
  // IMMEDIATE + DESC — scan/signal
  // ============================================================
  g(registry, 'SA.13'); // James Clerk Maxwell Tel   | SCAN, DESC

  // ============================================================
  // IMMEDIATE + DESC — multi-part
  // ============================================================
  g(registry, 'SA.18'); // Contracted Research       | DESC, ROTATE, TECH_ANY, DESC

  // ============================================================
  // IMMEDIATE — signal-token
  // ============================================================
  g(registry, 'SA.3'); // NASA Deep Space Network   | SIGNAL_TOKEN(3)
  g(registry, 'SA.4'); // Breakthrough Message      | SIGNAL_TOKEN, MOVE

  g(registry, 'SA.22'); // TESS Satellite            | ANY_SIGNAL(2), DESC
  g(registry, 'SA.37'); // Pandora Satellite         | ANY_SIGNAL, DESC

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
  g(registry, 'SA.28'); // Restructuring             | DESC, QM

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
