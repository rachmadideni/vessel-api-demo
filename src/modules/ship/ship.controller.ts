import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ShipService } from './ship.service';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { Ship } from './entities/ship.entity';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('ship')
@ApiTags('ship')
export class ShipController {
  constructor(private readonly shipService: ShipService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:vessels')
  @ApiBearerAuth()
  create(@Body() createShipDto: CreateShipDto) {
    return this.shipService.create(createShipDto);
  }

  @Get()
  @ApiPagination({ model: CreateShipDto, description: 'List of ships' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:vessels')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Ship>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.shipService.paginate(options);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Data success retrieved',
    type: Ship,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:vessels')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.shipService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Data success update',
    type: Ship,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:vessels')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateShipDto: UpdateShipDto) {
    return this.shipService.update(id, updateShipDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:vessels')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.shipService.remove(id);
  }
}
