import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Equipment } from './entities/equipment.entity';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('equipment')
@ApiTags('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('create:equipments')
  @ApiBearerAuth()
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get('/tree')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:equipments')
  @ApiBearerAuth()
  findAllTree(): Promise<Equipment[]> {
    return this.equipmentService.findAll();
  }

  @Get()
  @ApiPagination({
    model: CreateEquipmentDto,
    description: 'List of equipments',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:equipments')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Equipment>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.equipmentService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:equipments')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:equipments')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateEquipmentDto: UpdateEquipmentDto) {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:equipments')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }
}
