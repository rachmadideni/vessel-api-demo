import { PartialType } from '@nestjs/swagger';
import { CreateShipTypeDto } from './create-ship-type.dto';

export class UpdateShipTypeDto extends PartialType(CreateShipTypeDto) {}
