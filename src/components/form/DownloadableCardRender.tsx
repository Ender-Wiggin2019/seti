/*
 * @Author: Ender-Wiggin
 * @Date: 2025-10-30 10:00:00
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-10-30 21:32:33
 * @Description: Downloadable version of CardRender using withDownloadable HOC.
 */

import { IBaseCard } from '@/types/BaseCard';
import { CardRender } from './CardRender';
import withDownloadable from './withDownloadable';

type CardRenderProps = {
  card: IBaseCard;
};

export const DownloadableCardRender = withDownloadable<CardRenderProps>(
  CardRender,
  (props) => props.card.id + '.png',
);

export default DownloadableCardRender;
