/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 11:42:57
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-13 01:36:18
 * @Description:
 */
import { useState } from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { Textarea } from '@/components/ui/textarea';

import { DESC } from '@/constant/effect';

import { EEffectType, Effect, ICustomizedEffect } from '@/types/effect';
import { Button } from '@/components/ui/button';

type Props = {
  currentEffects: Effect[];
  onChange?: (effect: ICustomizedEffect, action?: 'del') => void;
};
export const DescInput = ({ currentEffects, onChange }: Props) => {
  const descEffects = currentEffects.filter(
    (e) => e.effectType === EEffectType.CUSTOMIZED
  );
  const [newDesc, setNewDesc] = useState<string>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!newDesc) {
      return;
    }
    if (!editingId) {
      const newDescEffect = DESC(newDesc);
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
      {descEffects.map((de) => (
        <div key={de.id} className='flex'>
          <DescRender desc={de.desc} />
          <div onClick={() => handleEdit(de)}>Edit</div>
          <div onClick={() => handleDelete(de)}>Delete</div>
        </div>
      ))}
      <div>Workspace</div>
      {newDesc && (
        <div className='w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-950 ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:ring-primary'>
          <div className='scale-[3] w-24 background-black text-zinc-400'>
            <DescRender desc={newDesc} />
          </div>
        </div>
      )}
      <div className='relative'>
        <Textarea
          value={newDesc}
          className='w-full lg:w-64'
          onChange={(e) => setNewDesc(e.target.value)}
        />
      </div>
      <div className='flex justify-start items-center gap-4'>
        <Button variant='dark' className='w-40' onClick={handleAdd}>
          Create New
        </Button>
        <Button variant='highlight' className='w-40' onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};
