import type { IRenderNode } from '@seti/common/types/Icon';
import { extractDesc } from '@seti/common/utils/desc';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IDescTextRenderProps {
  desc: string;
  className?: string;
  tokenClassName?: string;
}

function formatToken(node: IRenderNode): string {
  if (node.type === 'text') return node.name;

  const tokenText =
    node.value == null ? node.name : `${node.value} ${node.name}`;
  return tokenText.replace(/-/g, ' ');
}

function renderNode(
  node: IRenderNode,
  key: string,
  tokenClassName?: string,
): ReactNode {
  if (node.type === 'text') return node.name;

  return (
    <span
      key={key}
      data-testid='desc-text-token'
      className={cn('font-semibold text-text-100', tokenClassName)}
    >
      {formatToken(node)}
    </span>
  );
}

export function DescTextRender({
  desc,
  className,
  tokenClassName,
}: IDescTextRenderProps): React.JSX.Element {
  const lines = extractDesc(desc);

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`}>
          {line.map((node, nodeIndex) =>
            renderNode(node, `${lineIndex}-${nodeIndex}`, tokenClassName),
          )}
          {lineIndex < lines.length - 1 ? (
            <br data-testid='desc-text-break' />
          ) : null}
        </span>
      ))}
    </span>
  );
}
