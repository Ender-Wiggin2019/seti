import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import { QuickStartCardPreview } from '@/features/setup/QuickStartCardPreview';

interface IQuickStartCardsThumbnailProps {
  cardIds: string[];
}

export function QuickStartCardsThumbnail({
  cardIds,
}: IQuickStartCardsThumbnailProps): React.JSX.Element | null {
  if (cardIds.length === 0) {
    return null;
  }

  return (
    <div
      className='flex min-w-0 items-center gap-1 overflow-x-auto'
      data-testid='player-quick-start-cards'
    >
      {cardIds.map((cardId) => {
        const card = PRELUDE_CARDS_BY_ID[cardId];
        return (
          <div
            key={cardId}
            className='shrink-0'
            data-testid={`quick-start-card-thumbnail-${cardId}`}
          >
            {card ? (
              <QuickStartCardPreview card={card} compact />
            ) : (
              <span className='chip font-mono text-[10px]'>{cardId}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
