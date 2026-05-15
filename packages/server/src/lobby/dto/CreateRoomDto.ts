import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { TAlienModulesEnabled } from '@/engine/GameOptions.js';

export class CreateRoomOptionsDto {
  @IsInt()
  @Min(2)
  @Max(4)
  playerCount!: number;

  @IsOptional()
  @IsString()
  scenarioPreset?: string;

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
  @IsIn([0, 120, 240, 300, 600])
  turnTimerSeconds?: number;
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
  @IsString()
  scenarioPreset?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateRoomOptionsDto)
  options?: CreateRoomOptionsDto;
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
}
