import { IsEnum, IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { maintenancePeriod } from '../../../common/dto/maintenancePeriod.dto';

export class CreateMaintenanceFormDto {
  @IsNotEmpty()
  @ApiProperty()
  shipId: string;

  @IsNotEmpty()
  @ApiProperty()
  jobId: string;

  @IsNotEmpty()
  @ApiProperty()
  documentNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  revisionNumber: string;

  @IsEnum(maintenancePeriod)
  @ApiProperty({ enum: maintenancePeriod, enumName: 'period' })
  maintenancePeriod: maintenancePeriod;

  @ApiProperty()
  approvalUser: [];
}
