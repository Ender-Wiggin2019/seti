/* eslint-disable @next/next/no-img-element */
import React from 'react';

import { ICorp } from '@/types/corp';

interface ICorpImageCardProps {
  corp: ICorp;
}

export default function CorpImageCard({ corp }: ICorpImageCardProps) {
  return (
    <div className='relative'>
      <p className='absolute bottom-2 z-2 text-7xl font-bold text-black opacity-20 shadow-md'>
        FAN MADE
      </p>
      <img
        src={`/images/corps/${corp.name}.jpg`}
        alt={corp.name}
        className='w-96 lg:hover:scale-[2] duration-300 hover:z-20 rounded-md'
      />
    </div>
  );
}
