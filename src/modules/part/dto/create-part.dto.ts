import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from '@nestjs/class-validator';
import { PartCategory } from 'src/common/dto/partCategory.dto';

export class CreatePartDto {
  @ApiProperty()
  @IsNotEmpty()
  number: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  grade: string;

  @ApiProperty()
  specification: string;

  @ApiProperty()
  @IsNotEmpty()
  shipId: string;

  @ApiProperty()
  @IsNotEmpty()
  EquipmentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PartCategory)
  category: PartCategory;

  @ApiProperty()
  @IsNotEmpty()
  partUnit: string;

  @ApiProperty()
  comment: string;
}
