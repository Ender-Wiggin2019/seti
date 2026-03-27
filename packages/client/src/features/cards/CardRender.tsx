import { CardRender as SetiCardRender } from '@seti/cards';
import type { IBaseCard } from '@seti/common/types/BaseCard';

interface ICardRenderProps {
  card: IBaseCard;
}

export function CardRender({ card }: ICardRenderProps): React.JSX.Element {
  return (
    <div data-testid={`card-render-${card.id}`}>
      <SetiCardRender card={card} />
    </div>
  );
}
