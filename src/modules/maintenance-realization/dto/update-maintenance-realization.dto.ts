import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceRealizationDto } from './create-maintenance-realization.dto';

export class UpdateMaintenanceRealizationDto extends PartialType(CreateMaintenanceRealizationDto) {}
