import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EExpansion } from '@/engine/GameOptions.js';
import { UpdateRoomOptionsDto } from '@/lobby/dto/CreateRoomDto.js';

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
