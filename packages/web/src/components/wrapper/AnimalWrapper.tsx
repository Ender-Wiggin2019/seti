/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 06:15:19
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-17 00:45:43
 * @Description:
 */
import React from 'react';

interface BaseCardWrapperProps {
  id: string;
  children: React.ReactNode;
}

const BaseCardWrapper: React.FC<BaseCardWrapperProps> = ({ id, children }) => {
  return (
    // <div className='' draggable={false}>
    <div className='card-wrapper'>{children}</div>
    // </div>
  );
};

export default BaseCardWrapper;
