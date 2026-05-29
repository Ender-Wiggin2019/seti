import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@/lib/cn';

const ResizablePanelGroup = Group;
const ResizablePanel = Panel;

function ResizableHandle({
  className,
  handleOrientation = 'vertical',
  withHandle,
  ...props
}: React.ComponentProps<typeof Separator> & {
  handleOrientation?: 'horizontal' | 'vertical';
  withHandle?: boolean;
}): React.JSX.Element {
  return (
    <Separator
      className={cn(
        'relative flex items-center justify-center bg-[color:var(--metal-edge-soft)] transition-colors',
        handleOrientation === 'horizontal' ? 'h-2 w-full' : 'h-full w-2',
        'hover:bg-accent-500/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <span
          aria-hidden
          className={cn(
            'z-10 rounded-full border border-[color:var(--metal-edge)] bg-surface-800 shadow-hairline-inset',
            handleOrientation === 'horizontal' ? 'h-2 w-8' : 'h-8 w-2',
          )}
        />
      ) : null}
    </Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
