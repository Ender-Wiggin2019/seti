/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 12:05:53
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 17:16:10
 * @Description:
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { BaseCard } from './BaseCard';

import BaseCardType from '@/types/BaseCard';
interface PreviewBaseCardProps {
  card: BaseCardType;
  showLink?: boolean;
}
import { useTranslation } from 'next-i18next';

export const PreviewBaseCard: React.FC<PreviewBaseCardProps> = ({
  card,
  showLink,
}) => {
  const { t } = useTranslation('seti');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className='w-fit'>
          <BaseCard card={card} />
        </div>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] bg-gradient-to-b from-zinc-100 to-white backdrop-blur-lg h-2/3'>
        <DialogHeader>
          <DialogTitle>{t(card.name)}</DialogTitle>
          <DialogDescription>
            {/* Make changes to your profile here. Click save when you're done. */}
          </DialogDescription>
        </DialogHeader>
        <div className='p-4 w-full flex justify-center items-center h-fit'>
          <div className='scale-[2] w-fit h-fit'>
            <BaseCard card={card} />
          </div>
        </div>
        {/* <DialogFooter>
          <Button type='submit'>Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
