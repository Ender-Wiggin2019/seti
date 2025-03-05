import { TIcon } from '@/types/element';
import { TShape } from '@/types/Icon';

// TODO: icon 和 resource 最好还是要做下区分
// 这个是用于 FE 筛选框的图标，并不是 card effect
export const getButtonIconShape = (icon: TIcon): TShape => {
  // hex action
  if (icon.includes('-action')) {
    return 'normal';
  }

  // tech
  if (icon.includes('-tech')) {
    return 'normal';
  }

  // trace
  if (icon.includes('-trace')) {
    return 'normal';
  }

  // resource
  if (icon.includes('income')) {
    return 'normal';
  }

  return 'round';
};
