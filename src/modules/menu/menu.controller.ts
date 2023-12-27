import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Menu } from './entities/menu.entity';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('menu')
@ApiTags('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:menus application')
  @ApiBearerAuth()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Get()
  @ApiPagination({
    model: CreateMenuDto,
    description: 'List of menu',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:menus application')
  @ApiBearerAuth()
  findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Menu>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return this.menuService.paginate(options);
  }

  @Get('all')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:menus application')
  @ApiBearerAuth()
  findAllMenu(): Promise<Menu[]> {
    return this.menuService.findAll();
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:menus application')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:menus application')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:menus application')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }

  @Delete(':id/permission/:permissionId')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:menus application')
  @ApiBearerAuth()
  removePermission(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.menuService.removePermission(id, permissionId);
  }
}
