/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-22 15:12:55
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-22 16:12:51
 * @Description:
 */
import { useTranslation } from 'next-i18next';

import { DescRender } from '@/components/effect/DescRender';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { e } from '@/constant/effect';
import { getIconItem } from '@/constant/icons';
import { CopyIcon } from 'lucide-react';

const effects = Object.values(e).map((effectFn) => {
  const effect = effectFn();
  const iconItem = getIconItem(effect);
  const suffix = iconItem?.options?.showValue ? '-2' : '';
  const example = `This is {${effect.type}${suffix}}.`;
  return {
    text: effect.type,
    // data: effect,
    example: example,
  };
});

export function EffectTable() {
  const { t } = useTranslation('common');

  const handleClick = (text: string) => {
    navigator?.clipboard?.writeText(`{${text}}`);
  };
  return (
    <Table>
      <TableCaption>{t('helper.desc')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[200px]'>{t('helper.name')}</TableHead>
          <TableHead>{t('helper.example')}</TableHead>
          <TableHead>{t('helper.display')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {effects.map((effect) => (
          <TableRow key={effect.text}>
            <TableCell className='font-lg text-primary font-bold items-center'>
              <div
                className='flex gap-2 cursor-pointer'
                onClick={() => handleClick(effect.text)}
              >
                {effect.text}
                <CopyIcon />
              </div>
            </TableCell>
            <TableCell className='font-medium'>{effect.example}</TableCell>
            <TableCell>
              <div className='scale-[2]'>
                <DescRender desc={effect.example} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className='text-right'>$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
    </Table>
  );
}
