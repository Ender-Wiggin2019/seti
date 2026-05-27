import {
  CardRender as SetiCardRender,
  PreludeCard as SetiPreludeCard,
  useCardRenderContext,
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
  // Mirror the image-mode Mission renderer: text mode also wants
  // per-branch claim flags + owner color so it can prefix claimed
  // branches with ✓ and dim them. Both paths read the same context
  // injected by the consumer (typically <PlayedMissions> wrapping
  // the slot in CardRenderContextProvider).
  const ctx = useCardRenderContext();
  const branchClaims =
    !isPreludeCard(card) && ctx?.branchClaimsByCardId
      ? ctx.branchClaimsByCardId[card.id]
      : undefined;
  const ownerColor = ctx?.ownerPlayerColor;

  return (
    <div data-testid={`card-render-${card.id}`}>
      {isPreludeCard(card) && textMode ? (
        <PreludeTextCard card={card} />
      ) : isPreludeCard(card) ? (
        <SetiPreludeCard card={card} />
      ) : textMode ? (
        <TextCard
          card={card}
          branchClaims={branchClaims}
          ownerColor={ownerColor}
        />
      ) : (
        <SetiCardRender card={card} />
      )}
    </div>
  );
}
