import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from '@nestjs/class-validator';
import { maintenancePeriod } from 'src/common/dto/maintenancePeriod.dto';

export class MaintenanceReportsDto {
  @ApiProperty({
    example: 'vessel or ship id',
  })
  vesselId: string;

  @ApiProperty({
    example: 'Enum (capitalized) Harian | Bulanan',
  })
  @IsEnum(maintenancePeriod)
  maintenancePeriod: maintenancePeriod;

  @ApiProperty()
  formDate: string;
}
