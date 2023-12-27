import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateMaintenancePlanApproveDto {
	@ApiProperty()
	@IsNotEmpty()
	idApprove: string

	@ApiProperty()
	@IsNotEmpty()
	idMaintenance: string

	idUser: string

	@ApiProperty()
	approvalNotes: string
}