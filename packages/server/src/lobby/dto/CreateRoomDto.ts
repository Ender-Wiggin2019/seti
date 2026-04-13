import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateRoomOptionsDto {
  @IsInt()
  @Min(2)
  @Max(4)
  playerCount!: number;

  @IsOptional()
  @IsString()
  scenarioPreset?: string;
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
