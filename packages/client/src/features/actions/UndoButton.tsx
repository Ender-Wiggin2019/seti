import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export interface IUndoButtonProps {
  disabled: boolean;
  onRequestUndo: () => void;
}

/**
 * UndoButton — small ghost-metal pill. The leading glyph is an
 * instrument-style "back" triangle rendered in CSS so we don't pull
 * an icon dependency for a single chrome element.
 */
export function UndoButton({
  disabled,
  onRequestUndo,
}: IUndoButtonProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={disabled}
      onClick={onRequestUndo}
      data-testid='undo-button'
      className='h-7 gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.14em]'
    >
      <span
        aria-hidden
        className='inline-block h-0 w-0 border-y-[4px] border-r-[5px] border-y-transparent border-r-current'
      />
      {t('client.common.undo')}
    </Button>
  );
}
