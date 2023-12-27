import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateShipTypeDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
