/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 11:42:57
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-12 12:17:59
 * @Description:
 */
import { useState } from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { Textarea } from '@/components/ui/textarea';

import { DESC } from '@/constant/effect';

import { EEffectType, Effect, ICustomizedEffect } from '@/types/effect';

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
    <div className='flex flex-col'>
      {descEffects.map((de) => (
        <div key={de.id} className='flex'>
          <DescRender desc={de.desc} />
          <div onClick={() => handleEdit(de)}>Edit</div>
          <div onClick={() => handleDelete(de)}>Delete</div>
        </div>
      ))}
      {newDesc && (
        <div className='scale-[3]'>
          <DescRender desc={newDesc} />
        </div>
      )}
      <div>Workspace</div>
      <Textarea
        value={newDesc}
        className='w-64'
        onChange={(e) => setNewDesc(e.target.value)}
      />
      <div onClick={handleAdd}>Create New</div>
      <div onClick={handleSave}>Save</div>
    </div>
  );
};
