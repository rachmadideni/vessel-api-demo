import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Role } from './entities/role.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('roles')
@ApiTags('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:user groups')
  @ApiBearerAuth()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiPagination({
    model: CreateRoleDto,
    description: 'List of roles',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user groups')
  @ApiBearerAuth()
  findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Role>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return this.rolesService.paginate(options);
  }

  @Get('all')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user groups')
  @ApiBearerAuth()
  findAllRoles(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user groups')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:user groups')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:user groups')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Delete(':roleId/permission/:permissionId')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:user groups')
  @ApiBearerAuth()
  removePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.removeRolePermission(roleId, permissionId);
  }
}
