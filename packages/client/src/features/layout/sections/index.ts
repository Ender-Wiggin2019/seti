import { registerSection } from '../sectionRegistry';
import { ActionBarSection } from './ActionBarSection';
import { AlienBoardSection } from './AlienBoardSection';
import { CardRowsSection } from './CardRowsSection';
import { EndGameSection } from './EndGameSection';
import { HandSection } from './HandSection';
import { LogSection } from './LogSection';
import { PlanetBoardSection } from './PlanetBoardSection';
import { PlayerBoardSection } from './PlayerBoardSection';
import { SolarSystemSection } from './SolarSystemSection';
import { TechBoardSection } from './TechBoardSection';
import { TopBarSection } from './TopBarSection';

/**
 * Registers every section adapter in one place. Imported once from
 * GameLayoutV2 / dev panel — splitting into per-file registrations is more
 * trouble than it's worth for the v1 fixed catalog.
 */
let registered = false;
export function ensureSectionsRegistered(): void {
  if (registered) return;
  registered = true;

  registerSection({
    id: 'topBar',
    titleKey: 'client.game_layout.tabs.board',
    Component: TopBarSection,
  });
  registerSection({
    id: 'actionBar',
    titleKey: 'client.action_bar.label',
    Component: ActionBarSection,
  });
  registerSection({
    id: 'hand',
    titleKey: 'client.game_layout.hand',
    Component: HandSection,
  });
  registerSection({
    id: 'solarSystem',
    titleKey: 'client.game_layout.tabs.board',
    Component: SolarSystemSection,
  });
  registerSection({
    id: 'planetBoard',
    titleKey: 'client.game_layout.tabs.planets',
    Component: PlanetBoardSection,
  });
  registerSection({
    id: 'techBoard',
    titleKey: 'client.game_layout.tabs.tech',
    Component: TechBoardSection,
  });
  registerSection({
    id: 'alienBoard',
    titleKey: 'client.game_layout.tabs.aliens',
    Component: AlienBoardSection,
  });
  registerSection({
    id: 'cardRows',
    titleKey: 'client.game_layout.tabs.cards',
    Component: CardRowsSection,
  });
  registerSection({
    id: 'playerBoard',
    titleKey: 'client.game_layout.personal_board',
    Component: PlayerBoardSection,
  });
  registerSection({
    id: 'log',
    titleKey: 'client.game_layout.log',
    Component: LogSection,
  });
  registerSection({
    id: 'endGame',
    titleKey: 'client.game_layout.tabs.scoring',
    Component: EndGameSection,
  });
}
