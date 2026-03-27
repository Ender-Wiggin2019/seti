import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(2)
  @Max(4)
  playerCount!: number;
}
