import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateEquipmentDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @ApiProperty()
  brand: string;

  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @ApiProperty({
    required: false,
  })
  spesification: string;

  @ApiProperty({
    required: false,
  })
  parentId: string;

  @ApiProperty()
  @IsNotEmpty()
  shipId: string;

  @ApiProperty()
  @IsNotEmpty()
  roomId: string;
}
