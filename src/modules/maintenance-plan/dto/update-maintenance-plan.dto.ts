import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class UpdateMaintenancePlanDto {
  @ApiProperty()
  @IsNotEmpty()
  formNumber: string;
}
