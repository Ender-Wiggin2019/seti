import {
  CardRender as SetiCardRender,
  PreludeCard as SetiPreludeCard,
} from '@seti/cards';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import type { IPreludeCard } from '@seti/common/types/prelude';
import { useTextMode } from '@/stores/debugStore';
import { PreludeTextCard } from './PreludeTextCard';
import { TextCard } from './TextCard';

interface ICardRenderProps {
  card: IBaseCard | IPreludeCard;
}

function isPreludeCard(card: IBaseCard | IPreludeCard): card is IPreludeCard {
  return 'upperEffects' in card && 'lowerEffects' in card;
}

export function CardRender({ card }: ICardRenderProps): React.JSX.Element {
  const textMode = useTextMode();

  return (
    <div data-testid={`card-render-${card.id}`}>
      {isPreludeCard(card) && textMode ? (
        <PreludeTextCard card={card} />
      ) : isPreludeCard(card) ? (
        <SetiPreludeCard card={card} />
      ) : textMode ? (
        <TextCard card={card} />
      ) : (
        <SetiCardRender card={card} />
      )}
    </div>
  );
}
