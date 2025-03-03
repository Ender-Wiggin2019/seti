import BaseCard from '@/types/BaseCard';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 23:59:26
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-03 14:06:53
 * @Description:
 */
function extractNumberFromString(str: string) {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function sortCards(cards: BaseCard[], ascending = true): BaseCard[] {
  return cards.sort((a, b) => {
    const aIsNumeric = /^\d+$/.test(a.id);
    const bIsNumeric = /^\d+$/.test(b.id);

    if (aIsNumeric && !bIsNumeric) return -1;
    if (!aIsNumeric && bIsNumeric) return 1;

    if (aIsNumeric && bIsNumeric) {
      const aNum = Number(a.id);
      const bNum = Number(b.id);
      return ascending ? aNum - bNum : bNum - aNum;
    }

    const aNum = extractNumberFromString(a.id);
    const bNum = extractNumberFromString(b.id);
    return ascending ? aNum - bNum : bNum - aNum;
  });
}
