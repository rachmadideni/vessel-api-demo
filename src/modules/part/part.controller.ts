import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Req } from '@nestjs/common';
import { PartService } from './part.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { CreateEquipmentDto } from '../equipment/dto/create-equipment.dto';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Part } from './entities/part.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { CreatePartUnitDto } from './dto/create-part-unit.dto';
import { UpdatePartUnitDto } from './dto/update-part-unit.dto';
@Controller('part')
@ApiTags('part')
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:parts')
  @ApiBearerAuth()
  create(@Body() createPartDto: CreatePartDto) {
    return this.partService.create(createPartDto);
  }

  @Get()
  @ApiPagination({
    model: CreateEquipmentDto,
    description: 'List of parts',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:parts')
  @ApiBearerAuth()
  async findAll(@Req() request, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Part>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };

    // check request object and gets the shipId and role
    // TODO: this should be handled by a custom decorator
    const users = Object.keys(request.user)
      .filter((item) => item === 'shipId' || item === 'role')
      .map((key) => ({ [key]: request.user[key] }));

    return await this.partService.paginate(options, users);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:parts')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.partService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:parts')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partService.update(id, updatePartDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:parts')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.partService.remove(id);
  }

  @Get(':query/search')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:parts')
  @ApiBearerAuth()
  async search(@Param('query') query: string) {
    return await this.partService.searchPart(query);
  }

  @Post('/unit')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:parts')
  @ApiBearerAuth()
  createUnit(@Body() createPartUnit: CreatePartUnitDto) {
    return this.partService.createPartUnit(createPartUnit);
  }

  @Patch('/unit/:id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:parts')
  @ApiBearerAuth()
  async updateUnit(@Param('id') id: string, @Body() updatePartUnit: UpdatePartUnitDto) {
    return await this.partService.updatePartUnit(id, updatePartUnit);
  }

  @Get('/unit/all')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:parts')
  @ApiBearerAuth()
  async getPartUnit() {
    try {
      return this.partService.getPartUnit();
    } catch (err) {
      console.log(err);
    }
  }
}
