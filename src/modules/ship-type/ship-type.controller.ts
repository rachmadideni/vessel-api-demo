import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ShipTypeService } from './ship-type.service';
import { CreateShipTypeDto } from './dto/create-ship-type.dto';
import { UpdateShipTypeDto } from './dto/update-ship-type.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { ShipType } from './entities/ship-type.entity';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('ship-type')
@ApiTags('ship type')
export class ShipTypeController {
  constructor(private readonly typeService: ShipTypeService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: ShipType,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:ship types')
  @ApiBearerAuth()
  create(@Body() createTypeDto: CreateShipTypeDto) {
    return this.typeService.create(createTypeDto);
  }

  @Get()
  @ApiPagination({
    model: CreateShipTypeDto,
    description: 'List of Ship types',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:ship types')
  @ApiBearerAuth()
  findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<ShipType>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return this.typeService.paginate(options);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'response success retreived',
    type: ShipType,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:ship types')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.typeService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Data success updated',
    type: ShipType,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:ship types')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateTypeDto: UpdateShipTypeDto) {
    return this.typeService.update(id, updateTypeDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:ship types')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.typeService.remove(id);
  }
}
