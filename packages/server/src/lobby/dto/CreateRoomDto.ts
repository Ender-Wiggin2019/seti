import type { TSoloDifficulty } from '@seti/common/types/protocol/solo';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EExpansion,
  type ISpaceAgencyOptions,
  type TAlienModulesEnabled,
} from '@/engine/GameOptions.js';

export class SpaceAgencyOptionsDto implements ISpaceAgencyOptions {
  @IsBoolean()
  enabled!: boolean;

  @IsBoolean()
  agencies!: boolean;

  @IsBoolean()
  startResourceCards!: boolean;

  @IsBoolean()
  newDeck!: boolean;

  @IsBoolean()
  newAlienSpecies!: boolean;
}

export class CreateRoomOptionsDto {
  @IsInt()
  @Min(2)
  @Max(4)
  playerCount!: number;

  @IsOptional()
  @IsObject()
  alienModulesEnabled?: Partial<TAlienModulesEnabled>;

  @IsOptional()
  @IsBoolean()
  undoAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  timerPerTurn?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(EExpansion, { each: true })
  expansions?: EExpansion[];

  @IsOptional()
  @IsBoolean()
  isSoloMode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  soloDifficulty?: TSoloDifficulty;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SpaceAgencyOptionsDto)
  spaceAgencyOptions?: SpaceAgencyOptionsDto;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(4)
  playerCount?: number;

  @IsOptional()
  @IsString()
  seed?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateRoomOptionsDto)
  options?: CreateRoomOptionsDto;

  @IsOptional()
  @IsBoolean()
  visibleInLobby?: boolean;
}

export class UpdateRoomOptionsDto {
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(4)
  playerCount?: number;

  @IsOptional()
  @IsObject()
  alienModulesEnabled?: Partial<TAlienModulesEnabled>;

  @IsOptional()
  @IsBoolean()
  undoAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  timerPerTurn?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(EExpansion, { each: true })
  expansions?: EExpansion[];

  @IsOptional()
  @IsBoolean()
  isSoloMode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  soloDifficulty?: TSoloDifficulty;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SpaceAgencyOptionsDto)
  spaceAgencyOptions?: SpaceAgencyOptionsDto;
}

export class ListRoomsQueryDto {
  @IsOptional()
  @IsIn(['waiting', 'playing', 'finished'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
