import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EExpansion } from '@/engine/GameOptions.js';
import {
  CreateRoomOptionsDto,
  UpdateRoomOptionsDto,
} from '@/lobby/dto/CreateRoomDto.js';

describe('CreateRoomOptionsDto', () => {
  it('accepts solo fields submitted by the create room UI', async () => {
    const dto = plainToInstance(CreateRoomOptionsDto, {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 3,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it.each(['scenarioPreset', 'turnTimerSeconds'])(
    'rejects legacy %s room option',
    async (field) => {
      const dto = plainToInstance(CreateRoomOptionsDto, {
        playerCount: 2,
        [field]: field === 'turnTimerSeconds' ? 120 : 'behavior-flow',
      });

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors).toEqual([
        expect.objectContaining({
          property: field,
        }),
      ]);
    },
  );
});

describe('UpdateRoomOptionsDto', () => {
  it('accepts Space Agency option patches used by the room settings UI', async () => {
    const dto = plainToInstance(UpdateRoomOptionsDto, {
      expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
      spaceAgencyOptions: {
        enabled: true,
        agencies: true,
        startResourceCards: false,
        newDeck: false,
        newAlienSpecies: false,
      },
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});
