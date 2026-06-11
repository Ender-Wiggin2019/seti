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
        'group relative flex shrink-0 items-center justify-center bg-transparent transition-colors',
        handleOrientation === 'horizontal' ? 'h-1.5 w-full' : 'h-full w-1.5',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500/50',
        className,
      )}
      {...props}
    >
      {/* Always-on hairline; brightens on hover/drag. */}
      <span
        aria-hidden
        className={cn(
          'rounded-full bg-[color:var(--metal-edge-soft)] transition-colors group-hover:bg-accent-500/60 group-data-[resize-handle-active]:bg-accent-500/70',
          handleOrientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        )}
      />
      {withHandle ? (
        <span
          aria-hidden
          className={cn(
            'absolute rounded-full bg-[color:var(--metal-edge)] transition-colors group-hover:bg-accent-500/70',
            handleOrientation === 'horizontal' ? 'h-[3px] w-5' : 'h-5 w-[3px]',
          )}
        />
      ) : null}
    </Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
