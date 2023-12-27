import { IsDateString, IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @ApiProperty()
  shipTypeId: string;

  @IsNotEmpty()
  @ApiProperty()
  callSign: string;

  @IsNotEmpty()
  @ApiProperty()
  imoNumber: string;

  @ApiProperty()
  mmssiNumber: string;

  @IsDateString()
  @ApiProperty()
  yearBuild: string;

  @ApiProperty()
  grossTonnage: string;

  @ApiProperty()
  deadWeightTonnage: string;

  @ApiProperty()
  lengthOverAll: string;

  @ApiProperty()
  propellerType: string;

  @ApiProperty()
  mainEngine: string;

  @ApiProperty()
  auxEngine: string;

  @ApiProperty()
  auxEngine2: string;

  @ApiProperty()
  auxEngine3: string;
}
