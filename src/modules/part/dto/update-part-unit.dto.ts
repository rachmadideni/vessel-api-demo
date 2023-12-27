import { PartialType } from '@nestjs/swagger';
import { CreatePartUnitDto } from './create-part-unit.dto';

export class UpdatePartUnitDto extends PartialType(CreatePartUnitDto) {}
