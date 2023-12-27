import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateApprovalDto {
  @ApiProperty()
  @IsNotEmpty()
  id: string;

  status: string;
  maintenanceId: string;
  userId: string;
}
