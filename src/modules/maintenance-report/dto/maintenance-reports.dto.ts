import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from '@nestjs/class-validator';
import { maintenancePeriod } from 'src/common/dto/maintenancePeriod.dto';

export class MaintenanceReportsDto {
  @ApiProperty({
    example: 'vessel or ship id',
    required: false,
  })
  @IsOptional()
  vesselId?: string;

  @ApiProperty({
    example: 'Enum (capitalized) Harian | Bulanan',
    enum: maintenancePeriod,
    required: false,
  })
  @IsOptional()
  @IsEnum(maintenancePeriod)
  maintenancePeriod?: maintenancePeriod | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  formDate?: string;
}
