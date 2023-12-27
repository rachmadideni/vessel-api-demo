import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateDamageFormDto {
  @IsNotEmpty()
  @ApiProperty()
  shipId: string;

  @IsNotEmpty()
  @ApiProperty()
  reportDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  effectiveDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  eventDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  revision: string;

  @IsNotEmpty()
  @ApiProperty()
  formNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  documentNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  port: string;

  @IsNotEmpty()
  @ApiProperty()
  damageType: string[];

  @IsNotEmpty()
  @ApiProperty()
  damageCause: string[];

  @IsNotEmpty()
  @ApiProperty()
  damageRepairPlan: string[];

  @IsNotEmpty()
  @ApiProperty()
  notes: string;
}
