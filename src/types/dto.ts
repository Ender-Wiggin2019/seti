/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-10 10:28:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-11 20:59:56
 * @Description:
 */

import { z } from 'zod';

import { EAlienType, ECardType } from '@/types/BaseCard';
import { EResource, ESector } from '@/types/element';

const EResourceSchema = z.nativeEnum(EResource),
  ESectorSchema = z.nativeEnum(ESector),
  ECardTypeSchema = z.nativeEnum(ECardType),
  EAlienTypeSchema = z.nativeEnum(EAlienType),
  EffectSchema = z.object({
    type: z.string(),
    value: z.number(),
  });

export const BaseCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.object({
    src: z.string(),
  }),

  // upper
  freeAction: z.array(
    z.object({
      type: EResourceSchema,
      value: z.number(),
    })
  ),
  sector: z.string(),
  price: z.number(),
  income: EResourceSchema,
  effects: z.array(z.record(z.string())),
  description: z.optional(z.string()),
  flavorText: z.optional(z.string()),

  // special
  special: z.optional(
    z.object({
      danger: z.optional(z.number()),
      descHelper: z.optional(z.string()), // temporary translation for some texts
    })
  ),

  // meta data
  source: z.optional(z.string()),
  cardType: z.optional(z.string()),
  alien: z.optional(z.string()),
});

export type BaseCardSchemaDto = z.infer<typeof BaseCardSchema>;
