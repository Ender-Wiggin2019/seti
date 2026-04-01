import { EStarName } from '@seti/common/constant/sectorSetup';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { AdvancedNavigationSystem } from '../base/AdvancedNavigationSystemCard.js';
import { Alice } from '../base/AliceCard.js';
import { AnySignalQuickMissionCard } from '../base/AnySignalQuickMissionCard.js';
import { Apollo11Mission } from '../base/Apollo11MissionCard.js';
import { AsteroidsResearch } from '../base/AsteroidsResearchCard.js';
import { Atlas } from '../base/AtlasCard.js';
import { CassiniProbe } from '../base/CassiniProbeCard.js';
import { CornellUniversity } from '../base/CornellUniversityCard.js';
import { Dragonfly } from '../base/DragonflyCard.js';
import { createGenericCard } from '../base/GenericCards.js';
import { GmrtTelescope } from '../base/GmrtTelescopeCard.js';
import { GreenBankTelescope } from '../base/GreenBankTelescopeCard.js';
import { HerschelSpaceObservatory } from '../base/HerschelSpaceObservatoryCard.js';
import { JunoProbe } from '../base/JunoProbeCard.js';
import { LinguisticAnalysis } from '../base/LinguisticAnalysisCard.js';
import { LovellTelescope } from '../base/LovellTelescopeCard.js';
import { MessengerProbe } from '../base/MessengerProbeCard.js';
import { NearEarthAsteroidsSurvey } from '../base/NearEarthAsteroidsSurveyCard.js';
import { NiacProgram } from '../base/NiacProgramCard.js';
import { ObservationQuickMissionCard } from '../base/ObservationQuickMissionCard.js';
import { OdinusMission } from '../base/OdinusMissionCard.js';
import { PlanetaryGeologicMap } from '../base/PlanetaryGeologicMapCard.js';
import { ProjectLongshot } from '../base/ProjectLongshotCard.js';
import { QuantumComputer } from '../base/QuantumComputerCard.js';
import { RomanSpaceTelescope } from '../base/RomanSpaceTelescopeCard.js';
import { RosettaProbe } from '../base/RosettaProbeCard.js';
import { SpaceLaunchSystem } from '../base/SpaceLaunchSystemCard.js';
import { SpaceShuttle } from '../base/SpaceShuttleCard.js';
import { SquareKilometreArray } from '../base/SquareKilometreArrayCard.js';
import { TardigradesStudy } from '../base/TardigradesStudyCard.js';
import { TridentProbe } from '../base/TridentProbeCard.js';
import { UranusOrbiter } from '../base/UranusOrbiterCard.js';
import { VeneraProbe } from '../base/VeneraProbeCard.js';
import { WesterborkTelescope } from '../base/WesterborkTelescopeCard.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

function g(registry: CardRegistry, id: string): void {
  registry.register(id, () => createGenericCard(loadCardData(id)));
}

export function registerBaseCards(registry: CardRegistry): void {
  // ============================================================
  // GENERIC IMMEDIATE — pure base effects, fully config-driven
  // ============================================================
  g(registry, '48'); // Breakthrough Starshot          | MOVE, SIGNAL_RED
  g(registry, '49'); // Breakthrough Watch             | MOVE, SIGNAL_YELLOW
  g(registry, '56'); // Breakthrough Listen            | MOVE, SIGNAL_BLUE
  g(registry, '57'); // Effelsberg Telescope           | CARD_ANY, ROTATE, TECH_SCAN
  g(registry, '59'); // Ion Propulsion System          | ENERGY, ROTATE, TECH_PROBE
  g(registry, '69'); // Large Hadron Collider          | DATA, ROTATE, TECH_COMPUTER
  g(registry, '85'); // Starship                       | LAUNCH, ROTATE, TECH_PROBE
  g(registry, '109'); // Low-Power Microprocessors      | ENERGY, ROTATE, TECH_COMPUTER
  g(registry, '110'); // Press Statement                | PUBLICITY(3)
  g(registry, '121'); // Future Circular Collider       | DATA(3), ROTATE, TECH_COMPUTER
  g(registry, '130'); // Low-Cost Space Launch          | LAUNCH
  g(registry, '135'); // Noto Radio Observatory         | PUBLICITY, SCAN
  g(registry, '137'); // SETI Data Archive              | DATA(2)

  // ============================================================
  // BESPOKE — custom play logic, individual card files
  // ============================================================
  registry.register('16', () => new Dragonfly()); // land with allowDuplicate
  registry.register('50', () => new SquareKilometreArray()); // card-row signal marking

  // ============================================================
  // QUICK MISSION — launch + mission (bespoke: explicit planet conditions)
  // Probe launch cards: LAUNCH + optional resources + QUICK_MISSION
  // ============================================================
  registry.register('5', () => new VeneraProbe()); // QM: orbit/land Venus
  registry.register('6', () => new JunoProbe()); // QM: orbit/land Jupiter
  registry.register('7', () => new MessengerProbe()); // QM: orbit/land Mercury
  registry.register('8', () => new CassiniProbe()); // QM: orbit/land Saturn
  registry.register('31', () => new SpaceLaunchSystem()); // QM: 3 landings (no moons)
  registry.register('58', () => new UranusOrbiter()); // QM: orbit/land Uranus
  registry.register('60', () => new TridentProbe()); // QM: orbit/land Neptune
  registry.register('104', () => new RosettaProbe()); // QM: probe on comet
  registry.register('132', () => new SpaceShuttle()); // QM: 5 total orbit+land

  // QUICK MISSION — tech + mission
  // Tech research cards: ROTATE + TECH + QUICK_MISSION
  registry.register('10', () => new OdinusMission()); // QM: orbit/land Neptune + Uranus
  registry.register('61', () => new QuantumComputer()); // QM: score ≥ 50
  registry.register('64', () => new Alice()); // QM: per blue trace
  registry.register('66', () => new GmrtTelescope()); // QM: per red trace
  registry.register('70', () => new Atlas()); // QM: 3 blue traces
  registry.register('87', () => new ProjectLongshot()); // QM: probe ≥ 5 from Earth
  registry.register('97', () => new Apollo11Mission()); // QM: per yellow trace
  registry.register('103', () => new WesterborkTelescope()); // QM: 2 cards same sector
  registry.register('111', () => new RomanSpaceTelescope()); // QM: 2 total orbits
  registry.register('112', () => new PlanetaryGeologicMap()); // QM: orbit+land same planet

  // QUICK MISSION — scan / signal + mission
  registry.register('51', () => new LovellTelescope()); // QM: publicity >= 8
  registry.register('105', () => new GreenBankTelescope()); // QM: red trace >= 3

  // QUICK MISSION — resource + mission
  registry.register('89', () => new NiacProgram()); // QM: no cards in hand
  registry.register('95', () => new NearEarthAsteroidsSurvey()); // QM: probe on near-Earth asteroids
  registry.register('96', () => new TardigradesStudy()); // QM: 3 yellow traces
  registry.register('102', () => new LinguisticAnalysis()); // QM: R+Y+B on one species

  // ============================================================
  // QUICK MISSION + DESC — need custom handler for DESC portion
  // ============================================================

  // Observation quick-missions: signal + star location + QM
  registry.register(
    '37',
    () => new ObservationQuickMissionCard('37', EStarName.PROXIMA_CENTAURI),
  ); // Proxima Centauri Obs    | SIGNAL_RED(2), DESC(location), QM
  registry.register(
    '39',
    () => new ObservationQuickMissionCard('39', EStarName.SIXTY_ONE_VIRGINIS),
  ); // 61 Virginis Obs         | SIGNAL_YELLOW(2), DESC(location), QM
  registry.register(
    '41',
    () => new ObservationQuickMissionCard('41', EStarName.SIRIUS_A),
  ); // Sirius A Obs            | SIGNAL_BLUE(2), DESC(location), QM
  registry.register(
    '43',
    () => new ObservationQuickMissionCard('43', EStarName.BETA_PICTORIS),
  ); // Beta Pictoris Obs       | SIGNAL_BLACK, DESC(location), QM

  // ============================================================
  // QUICK MISSION + custom signal placement
  // ============================================================

  // Exploration programs: any-signal constrained by planet sector + QM
  registry.register(
    '32',
    () =>
      new AnySignalQuickMissionCard('32', {
        placementMode: 'planet-sector',
        targetPlanet: EPlanet.MERCURY,
      }),
  ); // Mercury Exploration     | ANY_SIGNAL(2), QM
  registry.register(
    '33',
    () =>
      new AnySignalQuickMissionCard('33', {
        placementMode: 'planet-sector',
        targetPlanet: EPlanet.VENUS,
      }),
  ); // Venus Exploration       | ANY_SIGNAL(2), QM
  registry.register(
    '34',
    () =>
      new AnySignalQuickMissionCard('34', {
        placementMode: 'planet-sector',
        targetPlanet: EPlanet.MARS,
      }),
  ); // Mars Exploration        | ANY_SIGNAL(2), QM
  registry.register(
    '35',
    () =>
      new AnySignalQuickMissionCard('35', {
        placementMode: 'planet-sector',
        targetPlanet: EPlanet.JUPITER,
      }),
  ); // Jupiter Exploration     | ANY_SIGNAL(2), QM
  registry.register(
    '36',
    () =>
      new AnySignalQuickMissionCard('36', {
        placementMode: 'planet-sector',
        targetPlanet: EPlanet.SATURN,
      }),
  ); // Saturn Exploration      | ANY_SIGNAL(2), QM
  registry.register(
    '88',
    () =>
      new AnySignalQuickMissionCard('88', { placementMode: 'probe-sector' }),
  ); // Chandra Space Obs       | ANY_SIGNAL(2), QM
  registry.register(
    '115',
    () => new AnySignalQuickMissionCard('115', { placementMode: 'any-sector' }),
  ); // Canadian Hydrogen Tel   | ANY_SIGNAL, QM

  // DESC + any-signal + QM
  registry.register('134', () => new HerschelSpaceObservatory()); // Herschel Space Obs      | ANY_SIGNAL, DESC, QM

  // ============================================================
  // FULL MISSION — multi-objective missions
  // ============================================================

  // Pure full missions (no base effects beyond mission)
  g(registry, '1'); // Pioneer 11 Mission
  g(registry, '2'); // Mariner 10 Mission
  g(registry, '3'); // Voyager 2 Mission
  g(registry, '4'); // Galileo Mission
  g(registry, '76'); // NASA Research Center
  g(registry, '80'); // Cape Canaveral SFS
  g(registry, '82'); // Johnson Space Center
  g(registry, '101'); // Telescope Time Allocation
  g(registry, '116'); // Control Center
  registry.register('128', () => new AdvancedNavigationSystem()); // Advanced Navigation System
  registry.register('129', () => new AsteroidsResearch()); // Asteroids Research
  g(registry, '106'); // Strategic Planning
  registry.register('138', () => new CornellUniversity()); // Cornell University

  // Full missions with base effects
  g(registry, '77'); // NASA Astrobiology Inst  | PUBLICITY, FM
  g(registry, '78'); // SETI Institute          | PUBLICITY, FM
  g(registry, '79'); // ISS                     | PUBLICITY, FM
  g(registry, '94'); // Popularization of Sci   | PUBLICITY, FM
  g(registry, '107'); // First Black Hole Photo  | DATA(2), FM
  g(registry, '117'); // Lunar Gateway           | LAUNCH, FM
  g(registry, '131'); // Telescope Modernization | CARD_ANY, FM

  // Special edition full missions
  g(registry, 'SE EN 02'); // Gateway to Mars    | FM

  // ============================================================
  // END GAME — clean base effects + endgame scoring
  // ============================================================
  g(registry, '14'); // Mars Science Laboratory | PUBLICITY, DATA(2), EG
  g(registry, '62'); // Onsala Telescope        | ROTATE, TECH_SCAN, EG
  g(registry, '63'); // SHERLOC                 | ROTATE, TECH_PROBE, EG
  g(registry, '68'); // DUNE                    | ROTATE, TECH_COMPUTER, EG
  g(registry, '113'); // Solvay Conference       | PUBLICITY(2), EG
  g(registry, '127'); // NEAR Shoemaker          | PUBLICITY(2), EG

  // ============================================================
  // END GAME + DESC — scoring + custom handler
  // ============================================================

  // Observation endgame: signal + star location + EG scoring
  g(registry, '38'); // Barnard's Star Obs      | SIGNAL_RED(2), DESC(location), EG(per fulfill-red)
  g(registry, '40'); // Kepler 22 Obs           | SIGNAL_YELLOW(2), DESC(location), EG(per fulfill-yellow)
  g(registry, '42'); // Procyon Obs             | SIGNAL_BLUE(2), DESC(location), EG(per fulfill-blue)
  g(registry, '44'); // Vega Obs                | SIGNAL_BLACK, DESC(location), EG(per fulfill-black)

  // Other endgame + DESC
  g(registry, '12'); // Europa Clipper          | LAND, DESC, EG
  g(registry, '126'); // Euclid Telescope        | OR(ROTATE+TECH), DESC, EG

  // END GAME + UNHANDLED
  // TODO: UNHANDLED_EFFECT(display-card-signal)
  g(registry, '86'); // Giant Magellan Tel      | DISPLAY_CARD_SIGNAL, EG

  // ============================================================
  // IMMEDIATE + DESC — flyby group (MOVE + planet bonus)
  // Cards 19-29: grant movement + bonus when probe passes planet
  // ============================================================
  g(registry, '19'); // Gravitational Slingshot | MOVE(2), DESC(bonus)
  g(registry, '20'); // Mercury Flyby          | MOVE(2), DESC(mercury bonus)
  g(registry, '21'); // Venus Flyby            | MOVE(2), DESC(venus bonus)
  g(registry, '22'); // Mars Flyby             | MOVE(2), DESC(mars bonus)
  g(registry, '23'); // Jupiter Flyby          | MOVE(2), DESC(jupiter bonus)
  g(registry, '24'); // Saturn Flyby           | MOVE(3), DESC(saturn bonus)
  g(registry, '25'); // Lightsail              | MOVE(4), DESC(bonus)
  g(registry, '26'); // Through Asteroid Belt  | MOVE(2), DESC(bonus)
  g(registry, '27'); // Hubble Space Telescope | MOVE(1), DESC(bonus)
  g(registry, '28'); // Kepler Space Telescope | MOVE(1), DESC(bonus)
  g(registry, '29'); // James Webb Space Tel   | MOVE(1), DESC(bonus)

  // ============================================================
  // IMMEDIATE + DESC — telescope/scan group
  // Cards that interact with the scan/signal system + DESC
  // ============================================================

  // Scan action + DESC (custom scan behavior)
  g(registry, '52'); // Parkes Observatory      | SCAN, DESC
  g(registry, '53'); // Deep Synoptic Array     | SCAN, DESC
  g(registry, '54'); // VERITAS Telescopes      | SCAN, DESC
  g(registry, '55'); // Arecibo Observatory     | SCAN, DESC

  // Signal + DESC
  g(registry, '136'); // Algonquin Radio Obs     | 4-color signals, DESC

  // Telescope + DESC (tech + scan + desc)
  g(registry, '67'); // Yevpatoria Telescope    | PUBLICITY, ROTATE, TECH_SCAN, DESC
  g(registry, '119'); // PIXL                    | ROTATE, TECH_COMPUTER, DESC

  // ============================================================
  // IMMEDIATE + DESC — telescope/signal + UNHANDLED
  // TODO: UNHANDLED_EFFECT(display-card-signal)
  // ============================================================
  g(registry, '45'); // Allen Telescope Array   | DISPLAY_CARD_SIGNAL(2), DESC
  g(registry, '46'); // ALMA Observatory        | DISPLAY_CARD_SIGNAL(2), DESC
  g(registry, '47'); // Very Large Array        | DISPLAY_CARD_SIGNAL(2), DESC
  g(registry, '65'); // FAST Telescope          | DISPLAY_CARD_SIGNAL(2), ROTATE, TECH_SCAN

  // TODO: UNHANDLED_EFFECT(any-signal)
  g(registry, '83'); // Wow! Signal             | PUBLICITY, ANY_SIGNAL(2)
  g(registry, '118'); // PLATO                   | ANY_SIGNAL(3), DESC

  // ============================================================
  // IMMEDIATE + DESC — tech research group
  // Tech research + additional DESC effects
  // ============================================================
  g(registry, '71'); // Focused Research        | ROTATE, TECH_ANY, DESC
  g(registry, '72'); // Scientific Cooperation  | ROTATE, TECH_ANY, DESC
  g(registry, '81'); // Int'l Collaboration     | TECH_ANY, DESC

  // ============================================================
  // IMMEDIATE + DESC — launch group
  // Launch probes + additional DESC effects
  // ============================================================
  g(registry, '9'); // Falcon Heavy            | LAUNCH(2), PUBLICITY, DESC(ignore probe limit)
  g(registry, '74'); // Pre-launch Testing      | LAUNCH, DESC
  g(registry, '133'); // Optimal Launch Window   | LAUNCH, DESC

  // ============================================================
  // IMMEDIATE + DESC — land group
  // Landing probes + additional DESC effects
  // ============================================================
  g(registry, '13'); // Perseverance Rover      | LAND, DESC

  // ============================================================
  // IMMEDIATE + DESC — movement/flyby related
  // Movement + special effects beyond simple flyby
  // ============================================================
  g(registry, '123'); // Asteroids Flyby         | MOVE(1), DESC
  g(registry, '124'); // Cometary Encounter      | MOVE(2), DESC
  g(registry, '125'); // Trajectory Correction   | MOVE(1), DESC

  // ============================================================
  // IMMEDIATE + DESC — resource/draw group
  // Draw cards or gain resources + DESC effects
  // ============================================================
  g(registry, '11'); // Grant                   | CARD_ANY, DESC(reveal + gain freeAction)
  g(registry, '15'); // Atmospheric Entry       | DESC, SCORE(3), DATA, CARD_ANY
  g(registry, '75'); // Extremophiles Study     | TRACE_ANY, DESC
  g(registry, '92'); // NASA Image of the Day   | PUBLICITY(2), DESC
  g(registry, '114'); // Planet Hunters          | CARD_ANY, DESC

  // ============================================================
  // IMMEDIATE + DESC — pure DESC (text-only special effects)
  // Cards with only DESC effects — no standard base effects
  // ============================================================
  g(registry, '17'); // OSIRIS-REx              | DESC(special)
  g(registry, '18'); // Hayabusa                | DESC(special)
  g(registry, '30'); // Great Observatories     | DESC(special)
  g(registry, '73'); // Clean Space Initiative  | DESC(special)
  g(registry, '84'); // Sample Return           | DESC(special)
  g(registry, '90'); // Fuel Tanks Construction | DESC(special)
  g(registry, '91'); // Fusion Reactor          | DESC(special)
  g(registry, '93'); // Government Funding      | DESC(special)
  g(registry, '98'); // Coronal Spectrograph    | DESC(special)
  g(registry, '99'); // Electron Microscope     | DESC(special)
  g(registry, '100'); // Exascale Supercomputer  | DESC(special)
  g(registry, '108'); // SETI@Home               | DESC(special)
  g(registry, '120'); // Orbiting Lagrange Point | DESC(special)
  g(registry, '122'); // Amateur Astronomers     | DESC(special)

  // ============================================================
  // SPECIAL EDITION — base set
  // ============================================================
  g(registry, 'SE EN 01'); // Not a planet since 2006 | DESC
}
