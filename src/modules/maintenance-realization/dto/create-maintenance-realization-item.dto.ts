import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateMaintenanceRealizationItemDto {
  @ApiProperty({
    format: 'date',
  })
  @IsNotEmpty()
  implementedDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty()
  @IsNotEmpty()
  maintenanceRealizationId: string;

  createdBy: string;
}
