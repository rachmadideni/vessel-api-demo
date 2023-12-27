import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Material } from './entities/material.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('material')
@ApiTags('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:materials')
  @ApiBearerAuth()
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.create(createMaterialDto);
  }

  @Get()
  @ApiPagination({
    model: CreateMaterialDto,
    description: 'List of equipments',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:materials')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Material>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.materialService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:materials')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:materials')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:materials')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.materialService.remove(id);
  }
}
