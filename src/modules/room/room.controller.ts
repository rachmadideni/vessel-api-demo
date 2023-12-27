import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Room } from './entities/room.entity';
import { Ship } from '../ship/entities/ship.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('room')
@ApiTags('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiCreatedResponse({
    type: CreateRoomDto,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:rooms')
  @ApiBearerAuth()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiPagination({ model: CreateRoomDto, description: 'List of rooms' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:rooms')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Room>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.roomService.paginate(options);
  }

  @Get('/tree')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:rooms')
  @ApiBearerAuth()
  findAllTree(): Promise<Room[]> {
    return this.roomService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Data success retrieved',
    type: Ship,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:rooms')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Data success update',
    type: Ship,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:rooms')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:rooms')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
}
