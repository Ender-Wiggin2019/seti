import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getModel } from '@/utils/model';

import { ICorp, IModel } from '@/types/corp';

interface IModelCardProps {
  corp: ICorp;
  round: number;
  className?: string;
}

const ModelCard: React.FC<IModelCardProps> = ({ corp, round, className }) => {
  const model: IModel = getModel(corp, round);

  const formatValue = (value: number): string => {
    return value.toString();
  };

  return (
    <Card className={`w-full ${className || ''}`}>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>模型数据</span>
          {/* <Badge variant='secondary'>第 {round} 轮</Badge> */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
                  第一轮总资源
                </span>
                <Badge variant='outline'>
                  {formatValue(model.initResources)}
                </Badge>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
                  收入总收益
                </span>
                <Badge variant='outline'>
                  {formatValue(model.incomeValue)}
                </Badge>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
                  免费行动收益
                </span>
                <Badge variant='outline'>
                  {formatValue(model.freeActionValue || 0)}
                </Badge>
              </div>

              {model.modifyValue !== undefined && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
                    修正值
                  </span>
                  <Badge variant='outline'>
                    {formatValue(model.modifyValue)} ({corp.modifyReason})
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
              技能总收益
            </span>
            <Badge variant='outline'>
              {model.effectTriggerTimes} (触发次数) ✖️ {model.effectUnitValue}{' '}
              (单次收益) = {formatValue(model.effectTotalValue)}
            </Badge>
          </div>

          <div className='border-t border-zinc-200 dark:border-zinc-800 pt-4'>
            <div className='flex items-center justify-between'>
              <span className='text-lg font-semibold'>总模型价值</span>
              <Badge variant='default' className='text-base px-3 py-1'>
                {formatValue(model.totalValue)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCard;
