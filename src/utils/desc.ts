import { e } from '@/constant/effect';

import { IBaseEffect } from '@/types/effect';
import { TSize } from '@/types/element';
import { IRenderNode } from '@/types/Icon';

// such as `some text {credit-1} some text`
export const extractDesc = (desc: string): IRenderNode[][] => {
  const result: IRenderNode[][] = [[]];
  const regex = /{([^{}]+?)}|([^{}]+)/g;
  let match;

  while ((match = regex.exec(desc)) !== null) {
    if (match[2]) {
      // Special case: <br>
      const parts = match[2].split(/<br\s*\/?>/i);
      parts.forEach((part, index) => {
        if (part.trim()) {
          result[result.length - 1].push({
            type: 'text',
            name: part,
          });
        }
        if (index < parts.length - 1) {
          // Create a new sub-array after each <br>
          result.push([]);
        }
      });
    } else if (match[1]) {
      // This is a {xxx} or {xxx-xxx} pattern
      const innerMatch = match[1].match(/([^[\]]+)(?:\[(.*?)\])?/);
      if (innerMatch) {
        const namePart = innerMatch[1];
        const _size = innerMatch[2];
        const size = [
          'md',
          'sm',
          'xs',
          'xxs',
          'xxxs',
          'desc',
          'desc-mini',
        ].includes(_size)
          ? _size
          : undefined;
        const parts = namePart.split('-');
        const lastPart = parts[parts.length - 1];
        const isNumeric = !isNaN(Number(lastPart));

        if (isNumeric && parts.length > 1) {
          // If the last part is numeric and there are multiple parts
          const name = parts.slice(0, -1).join('-');
          const component: IRenderNode = {
            type: 'component',
            name: name,
            value: Number(lastPart),
            size: size as TSize,
          };
          result[result.length - 1].push(component);
        } else {
          // Otherwise, treat the whole as a name
          const component: IRenderNode = {
            type: 'component',
            name: namePart,
            size: size as TSize,
          };
          result[result.length - 1].push(component);
        }
      }
    }
  }

  return result;
};

export const renderNode2Effect = (node: IRenderNode): IBaseEffect | string => {
  if (node.type === 'text') {
    return node.name;
  }

  const fn = Object.values(e).find((effectFn) => {
    const effect = effectFn();
    if (effect.type === node.name) {
      return true;
    }
  });

  if (fn) {
    return {
      ...fn(node.value),
      // size: size || 'xs', // in desc, we only show small icons
    };
  }

  // NOTE: some special cases

  return node.name;
};

export const computeLength = (nodes: IRenderNode[]) => {
  return nodes.reduce((acc, node) => {
    if (node.type === 'text') {
      return acc + calculateSize(node.name);
    }

    if (node.type === 'component') {
      return acc + 5; // one component is around 4 chars
    }
    return acc + 1;
  }, 0);
};

// the icon in desc should be smaller
export const getDescIconSize = (
  nodes: IRenderNode[][],
  defaultSize?: TSize,
  smartSize?: boolean
): TSize => {
  // if (nodes?.[0]?.[0]?.size) {
  //   return nodes?.[0]?.[0]?.size;
  // }
  if (!smartSize) {
    return defaultSize || 'md';
  }
  const descLength = nodes.reduce((acc, node) => {
    return acc + computeLength(node);
  }, 0);

  if (descLength > 25) {
    if (defaultSize === 'desc' || defaultSize === 'xxs') {
      return 'desc-mini';
    } else {
      return 'desc';
    }
  }

  if (!defaultSize) {
    return 'desc';
  }

  // in description, size will be decreased by 1 step
  if (defaultSize === 'sm') {
    return 'xs';
  }

  if (defaultSize === 'xs') {
    return 'xxs';
  }

  if (defaultSize === 'xxs') {
    return 'desc';
  }

  if (defaultSize === 'desc') {
    return 'desc-mini';
  }

  return defaultSize;
};

export const getDescTextSize = (iconSize: TSize): TSize => {
  switch (iconSize) {
    case 'desc-mini':
      return 'desc';
    case 'desc':
      return 'xxs';
    case 'xxs':
      return 'xs';
    case 'xs':
      return 'sm';
    case 'sm':
      return 'lg';
    case 'md':
      return 'lg';
    default:
      return 'desc-mini';
  }
};

export function calculateSize(str: string) {
  let size = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode > 255) {
      size += 2;
    } else {
      size += 1;
    }
  }
  return size;
}
