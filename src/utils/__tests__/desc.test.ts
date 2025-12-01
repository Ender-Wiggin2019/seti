/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-07 23:02:36
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-09 01:55:02
 * @Description:
 */
import { e } from '@/constant/effect';
import { extractDesc, renderNode2Effect } from '@/utils/desc';

describe('extractDesc should work correctly', () => {
  it('should extract texts and components', () => {
    const result = extractDesc('Gain {publicity}.');
    expect(result).toEqual([
      [
        {
          type: 'text',
          name: 'Gain ',
        },
        {
          type: 'component',
          name: 'publicity',
        },
        {
          type: 'text',
          name: '.',
        },
      ],
    ]);
  });

  it('should extract multiple components', () => {
    const result = extractDesc(
      '{any-card}aa bbb {publicity-2-bb}{tech-any-1}c ccc<br> dd.',
    );
    expect(result).toEqual([
      [
        {
          type: 'component',
          name: 'any-card',
        },
        {
          type: 'text',
          name: 'aa bbb ',
        },
        {
          type: 'component',
          name: 'publicity-2-bb',
        },
        {
          type: 'component',
          name: 'tech-any',
          value: 1,
        },
        {
          type: 'text',
          name: 'c ccc',
        },
      ],
      [{ type: 'text', name: ' dd.' }],
    ]);
  });
});

describe('renderNode2Effect should work correctly', () => {
  it('should extract texts and components', () => {
    const result = renderNode2Effect({
      type: 'component',
      name: 'publicity',
      value: 2,
    });
    expect(result).toEqual(e.PUBLICITY(2));
  });
});
