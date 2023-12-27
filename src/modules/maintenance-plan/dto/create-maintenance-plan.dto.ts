import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { PlanDateDto } from './plan-date.dto';

export class CreateMaintenancePlanDto {
  @ApiProperty()
  @IsNotEmpty()
  formNumber: string;

  @ApiProperty({
    example: 'YYYY-MM-01',
  })
  @IsNotEmpty()
  realisationPeriod: string;

  @ApiProperty({
    example: 'ID Maintenance Form',
  })
  @IsNotEmpty()
  maintenanceFormId: string;

  @ApiModelProperty({ isArray: true, type: PlanDateDto })
  plan: PlanDateDto[];
}
