/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 01:13:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:13:16
 * @Description:
 */
import BaseCardType from '@/types/BaseCard';

const generateCards = (
  rows: number,
  cols: number,
  src: string
): BaseCardType[] => {
  const cards: BaseCardType[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = `${row * cols + col}`;
      cards.push({
        id,
        name: id,
        position: { src, row, col },
        // Other fields can be left empty or undefined
      });
    }
  }

  return cards;
};

export default generateCards;
