import { TSize } from '@/types/element';

export type TShape = 'diamond' | 'round' | 'normal';

export interface IRenderNode {
  type: 'text' | 'component';
  name: string; // if text, the desc; if component, the component name
  value?: number;
  size?: TSize;
}
