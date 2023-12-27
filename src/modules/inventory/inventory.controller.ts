import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('inventory')
@ApiTags('Inventory')
export class InventoryController {
  constructor() {}
}
