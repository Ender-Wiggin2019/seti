/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 11:42:57
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-08 00:45:01
 * @Description:
 */
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { DescRender } from '@/components/effect/DescRender';
import { Button } from '@/components/ui/button';
import { HelpButton } from '@/components/ui/helper-dialog';
import { Textarea } from '@/components/ui/textarea';

import { DESC } from '@/constant/effect';

import { EEffectType, Effect, ICustomizedEffect } from '@/types/effect';

type Props = {
  currentEffects: Effect[];
  onChange?: (effect: ICustomizedEffect, action?: 'del') => void;
  enableCreateNew?: boolean;
};
export const DescInput = ({
  currentEffects,
  onChange,
  enableCreateNew = true,
}: Props) => {
  const descEffects = currentEffects.filter(
    (e) => e.effectType === EEffectType.CUSTOMIZED
  ) as ICustomizedEffect[];
  const [newDesc, setNewDesc] = useState<string>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!newDesc) {
      return;
    }
    if (!enableCreateNew) {
      const newDescEffect = {
        ...(currentEffects[0] as ICustomizedEffect),
        desc: newDesc,
      };
      setEditingId(newDescEffect.id);

      onChange?.(newDescEffect);
    } else if (!editingId) {
      const newDescEffect = DESC(newDesc);
      setEditingId(newDescEffect.id);

      onChange?.(newDescEffect);
    } else {
      const updatedDescEffect = descEffects.find((e) => e.id === editingId);
      if (!updatedDescEffect) return;
      onChange?.({ ...updatedDescEffect, desc: newDesc });
    }
  };

  const handleDelete = (effect: ICustomizedEffect) => {
    onChange?.(effect, 'del');
  };

  const handleEdit = (effect: ICustomizedEffect) => {
    handleSave();
    setEditingId(effect.id);
    setNewDesc(effect.desc);
  };

  const handleAdd = () => {
    handleSave();
    setEditingId(null);
    setNewDesc('');
  };
  return (
    <div className='flex flex-col gap-2'>
      {enableCreateNew &&
        descEffects.map((de) => (
          <div key={de.id} className='flex gap-2'>
            <div
              className={cn(
                'flex-1 text-white/50 rounded-md ring-1 ring-white/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-950 ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:ring-primary',
                { 'text-white': de.id === editingId }
              )}
            >
              {de.desc}
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-16'
              onClick={() => handleEdit(de)}
            >
              Edit
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='w-16'
              onClick={() => handleDelete(de)}
            >
              Delete
            </Button>
          </div>
        ))}
      <div>Workspace</div>
      <div className='relative'>
        <Textarea
          value={newDesc}
          className='w-full lg:w-64'
          onChange={(e) => setNewDesc(e.target.value)}
        />
      </div>
      <HelpButton />
      {newDesc && (
        <>
          <div>Preview</div>
          <div className='flex justify-start w-full h-12 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-950 ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:ring-primary'>
            <div className='text-zinc-400'>
              <DescRender desc={newDesc} />
            </div>
          </div>
        </>
      )}
      <div className='flex justify-end items-center gap-4'>
        {enableCreateNew && (
          <Button variant='dark' className='w-40' onClick={handleAdd}>
            Create New
          </Button>
        )}
        <Button variant='highlight' className='w-40' onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};
