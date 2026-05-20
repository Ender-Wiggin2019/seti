import type { IPreludeCard } from '@seti/common/types/prelude';
import { useTranslation } from 'react-i18next';
import { CardRender } from '@/features/cards/CardRender';

interface IQuickStartCardPreviewProps {
  card: IPreludeCard;
  compact?: boolean;
}

const PRELUDE_CARD_WIDTH_PX = 150;
const PRELUDE_CARD_HEIGHT_PX = 209;

function effectSummary(card: IPreludeCard, emptyLabel: string): string {
  const effects = [...card.upperEffects, ...card.lowerEffects]
    .map((effect) => ('type' in effect ? effect.type : undefined))
    .filter(Boolean)
    .join(', ');
  return effects.length > 0 ? effects : emptyLabel;
}

export function QuickStartCardPreview({
  card,
  compact = false,
}: IQuickStartCardPreviewProps): React.JSX.Element {
  const { t: tCommon } = useTranslation('common');
  const scale = compact ? 0.46 : 0.72;

  return (
    <div
      className='shrink-0 overflow-hidden rounded-[4px]'
      data-testid={`quick-start-card-preview-${card.id}`}
      style={{
        width: `${Math.ceil(PRELUDE_CARD_WIDTH_PX * scale)}px`,
        height: `${Math.ceil(PRELUDE_CARD_HEIGHT_PX * scale)}px`,
      }}
    >
      <div
        className='pointer-events-none origin-top-left'
        style={{ transform: `scale(${scale})` }}
      >
        <CardRender card={card} />
      </div>
      <span className='sr-only'>
        {tCommon('client.quick_start_card.screen_reader_label', {
          id: card.id,
          summary: effectSummary(
            card,
            tCommon('client.quick_start_card.no_setup_mark'),
          ),
        })}
      </span>
    </div>
  );
}
