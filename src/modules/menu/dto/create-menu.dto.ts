import { IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @ApiProperty()
  identifier: string;

  @IsNotEmpty()
  @ApiProperty()
  groupMenu: string;

  @ApiProperty()
  menuPermissions: string[];

  @ApiProperty()
  groupOrderNo: number;

  @ApiProperty()
  groupMenuNo: number;
}
