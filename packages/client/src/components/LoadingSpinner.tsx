interface ILoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner(props: ILoadingSpinnerProps): React.JSX.Element {
  return (
    <div
      className='inline-flex items-center gap-3'
      role='status'
      aria-live='polite'
    >
      <span className='h-4 w-4 animate-spin rounded-full border-2 border-surface-700 border-t-accent-500' />
      <span className='text-sm text-text-300'>
        {props.label ?? 'Loading...'}
      </span>
    </div>
  );
}
