import { EventLog } from '@/features/log';
import { useGameContext } from '@/pages/game/GameContext';
import type { ISectionRenderProps } from '../sectionRegistry';

export function LogSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { events, gameState } = useGameContext();
  return <EventLog events={events} players={gameState?.players ?? []} />;
}
