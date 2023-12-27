import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateMaintenancePlanItemDto {
  @ApiProperty({
    format: 'date',
  })
  @IsNotEmpty()
  planDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty()
  @IsNotEmpty()
  maintenancePlanId: string;
}
