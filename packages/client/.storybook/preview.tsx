import type { Decorator, Preview } from '@storybook/react-vite';
import '@seti/cards/styles/card.css';
import '../src/styles/globals.css';
import '../src/i18n';
import { useDebugStore } from '../src/stores/debugStore';

const withClientShell: Decorator = (Story, context) => {
  useDebugStore.setState({ textMode: Boolean(context.parameters.textMode) });

  return (
    <div className='min-h-screen bg-background-950 p-4 text-text-100'>
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withClientShell],
  parameters: {
    layout: 'centered',
    textMode: false,
  },
};

export default preview;
