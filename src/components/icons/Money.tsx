/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 15:50:37
 * @Description:
 */
import React from 'react';

interface MoneyProps {
  value: number;
}

const Money: React.FC<MoneyProps> = ({ value }) => {
  return <div className='arknova-icon icon-money original-cost'>{value}</div>;
};

export default Money;
