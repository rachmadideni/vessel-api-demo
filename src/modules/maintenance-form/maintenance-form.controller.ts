import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { MaintenanceFormService } from './maintenance-form.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { CreateMaintenanceFormDto } from './dto/create-maintenance-form.dto';
import { UpdateMaintenanceFormDto } from './dto/update-maintenance-form.dto';
import { MaintenanceForm } from './entities/maintenance-form.entity';

@Controller('maintenance-form')
@ApiTags('maintenance form')
export class MaintenanceFormController {
  constructor(private readonly maintenanceFormService: MaintenanceFormService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance forms')
  @ApiBearerAuth()
  create(@Body() createMaintenanceFormDto: CreateMaintenanceFormDto) {
    return this.maintenanceFormService.create(createMaintenanceFormDto);
  }

  @Get()
  @ApiPagination({
    model: CreateMaintenanceFormDto,
    description: 'List of maintenance form',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance forms')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<MaintenanceForm>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.maintenanceFormService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance forms')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.maintenanceFormService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:maintenance forms')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateMaintenanceFormDto: UpdateMaintenanceFormDto) {
    return this.maintenanceFormService.update(id, updateMaintenanceFormDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:maintenance forms')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.maintenanceFormService.remove(id);
  }

  @Delete('approvalReference/:idApprovalReference')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:maintenance forms')
  @ApiBearerAuth()
  removeApproval(@Param('idApprovalReference') id: string) {
    return this.maintenanceFormService.removeApproval(id);
  }
}
