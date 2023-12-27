import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceFormDto } from './create-maintenance-form.dto';

export class UpdateMaintenanceFormDto extends PartialType(CreateMaintenanceFormDto) {}
