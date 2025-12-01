/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-07 16:02:10
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-07 17:21:35
 * @Description:
 */

import baseCards from '@/data/baseCards';

import { filterText } from '@/utils/filter';

describe('filterText', () => {
  const mockT = jest.fn((text) => `translated_${text}`);

  const cards = baseCards.filter((card) => ['1', '5', '30'].includes(card.id));

  it('should return all cards if text is empty', () => {
    const result = filterText('', cards, mockT);
    expect(result).toEqual(cards);
  });

  it('should filter cards based on id', () => {
    const result = filterText('1', cards, mockT);
    expect(result[0].id).toEqual('1');
  });

  it('should filter cards based on name', () => {
    const result = filterText(
      'translated_Great Observatories Pr',
      cards,
      mockT,
    );
    expect(result[0].id).toEqual('30');
  });

  it('should filter cards based on description', () => {
    const result = filterText('translated_desc.card-30', cards, mockT);
    expect(result[0].id).toEqual('30');
  });

  it('should filter cards based on flavorText', () => {
    const result = filterText('translated_30_fla', cards, mockT);
    expect(result[0].id).toEqual('30');
  });

  it('should filter cards based on effects', () => {
    const result = filterText('translated_desc.any-sig', cards, mockT);
    expect(result[0].id).toEqual('30');
  });
});
