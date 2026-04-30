import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  IInputResponse,
  IOrOptionsInputModel,
  IPlayerInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { InputRenderer } from './InputRenderer';

export interface IOrOptionsInputProps {
  model: IOrOptionsInputModel;
  onSubmit: (response: IInputResponse) => void;
}

function optionLabel(
  option: IPlayerInputModel,
  index: number,
  fallbackLabel: string,
): string {
  return option.title?.trim() || fallbackLabel;
}

export function OrOptionsInput({
  model,
  onSubmit,
}: IOrOptionsInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (model.options.length === 0) {
    return (
      <p className='text-xs text-text-500'>
        {t('client.input.no_available_options')}
      </p>
    );
  }

  const defaultTab = `or-tab-${0}`;

  return (
    <Tabs defaultValue={defaultTab} className='space-y-2'>
      <TabsList className='flex w-full flex-wrap gap-1'>
        {model.options.map((option, index) => (
          <TabsTrigger
            key={option.inputId}
            value={`or-tab-${index}`}
            data-testid={`input-or-tab-${index}`}
          >
            {optionLabel(
              option,
              index,
              t('client.input.option', { index: index + 1 }),
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {model.options.map((option, index) => (
        <TabsContent
          key={option.inputId}
          value={`or-tab-${index}`}
          className='mt-0'
        >
          <InputRenderer
            model={option}
            onSubmit={(response) =>
              onSubmit({
                type: EPlayerInputType.OR,
                index,
                response,
              })
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
