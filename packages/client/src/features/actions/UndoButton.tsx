import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export interface IUndoButtonProps {
  disabled: boolean;
  onRequestUndo: () => void;
}

export function UndoButton({
  disabled,
  onRequestUndo,
}: IUndoButtonProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      disabled={disabled}
      onClick={onRequestUndo}
      data-testid='undo-button'
      className='h-8 border border-surface-700/60 bg-surface-800/50 font-mono text-xs uppercase tracking-wide text-text-200 hover:bg-surface-700/70'
    >
      {t('client.common.undo')}
    </Button>
  );
}
