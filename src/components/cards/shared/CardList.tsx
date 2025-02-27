/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 06:15:19
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 00:03:21
 * @Description:
 */
import React, { ReactNode } from 'react';

interface CardListProps {
  children: ReactNode;
}

const CardList: React.FC<CardListProps> = ({ children }) => (
  <div className='-pt-1 grid w-full grid-cols-2 justify-items-center gap-4 px-1 lg:grid-cols-3 lg:px-2 xl:grid-cols-4'>
    {children}
  </div>
);

export default CardList;
