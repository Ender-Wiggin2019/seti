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

function optionLabel(option: IPlayerInputModel, index: number): string {
  return option.title?.trim() || `Option ${index + 1}`;
}

export function OrOptionsInput({
  model,
  onSubmit,
}: IOrOptionsInputProps): React.JSX.Element {
  if (model.options.length === 0) {
    return <p className='text-xs text-text-500'>No available options.</p>;
  }

  const defaultTab = `or-tab-${0}`;

  return (
    <Tabs defaultValue={defaultTab} className='space-y-2'>
      <TabsList className='flex w-full flex-wrap gap-1'>
        {model.options.map((option, index) => (
          <TabsTrigger key={option.inputId} value={`or-tab-${index}`}>
            {optionLabel(option, index)}
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
