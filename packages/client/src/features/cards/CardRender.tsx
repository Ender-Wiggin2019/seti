import { CardRender as SetiCardRender } from '@seti/cards';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTextMode } from '@/stores/debugStore';
import { TextCard } from './TextCard';

interface ICardRenderProps {
  card: IBaseCard;
}

export function CardRender({ card }: ICardRenderProps): React.JSX.Element {
  const textMode = useTextMode();

  return (
    <div data-testid={`card-render-${card.id}`}>
      {textMode ? <TextCard card={card} /> : <SetiCardRender card={card} />}
    </div>
  );
}
