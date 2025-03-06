import { e } from '@/constant/effect';

import { IBaseEffect } from '@/types/effect';
import { IRenderNode } from '@/types/Icon';

// such as `some text {credit-1} some text`
export const extractDesc = (desc: string): IRenderNode[] => {
  const result: IRenderNode[] = [];
  const regex = /{([^{}]+?)}|([^{}]+)/g;
  let match;

  while ((match = regex.exec(desc)) !== null) {
    if (match[2]) {
      // This is plain text outside of {}
      result.push({
        type: 'text',
        name: match[2],
      });
    } else if (match[1]) {
      // This is a {xxx} or {xxx-xxx} pattern
      const parts = match[1].split('-');
      const lastPart = parts[parts.length - 1];
      const isNumeric = !isNaN(Number(lastPart));

      if (isNumeric && parts.length > 1) {
        // If the last part is numeric and there are multiple parts
        const name = parts.slice(0, -1).join('-');
        result.push({
          type: 'component',
          name: name,
          value: Number(lastPart),
        });
      } else {
        // Otherwise, treat the whole as a name
        result.push({
          type: 'component',
          name: match[1],
        });
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
      size: 'xs', // in desc, we only show small icons
    };
  }

  // NOTE: some special cases

  return node.name;
};
