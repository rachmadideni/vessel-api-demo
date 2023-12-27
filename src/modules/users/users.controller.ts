import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Req, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { User } from './entities/user.entity';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:user accounts')
  @ApiBearerAuth()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiPagination({
    model: CreateUserDto,
    description: 'List of users',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user accounts')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<User>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.usersService.paginate(options);
  }

  @Get('permissions')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  findPermission(@Req() req: Request) {
    const id = req.user['sub'];
    return this.usersService.findUserPermission(id);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user accounts')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user accounts')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get('roles/all')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:user accounts')
  @ApiBearerAuth()
  async findAllRoles() {
    try {
      return await this.usersService.findAllRoles();
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:user accounts')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':userId/role/:roleId')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:user accounts')
  @ApiBearerAuth()
  removeRole(@Param('userId') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeUserRole(id, roleId);
  }
}
