import { Controller, Get, Post, Body, Param, Delete, DefaultValuePipe, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { MaintenanceRealizationService } from './maintenance-realization.service';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { CreateMaintenanceRealizationItemDto } from './dto/create-maintenance-realization-item.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { Request } from 'express';
import { CreateMaintenancePlanApproveDto } from '../maintenance-plan/dto/create-maintenance-plan-approve.dto';

@Controller('maintenance-realization')
@ApiTags('Maintenance realization')
export class MaintenanceRealizationController {
  constructor(private readonly maintenanceRealizationService: MaintenanceRealizationService) {}

  @Post('item')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance realizations')
  @ApiBearerAuth()
  create(@Body() createMaintenanceRealizationItemDto: CreateMaintenanceRealizationItemDto, @Req() req: Request) {
    createMaintenanceRealizationItemDto.createdBy = req.user['sub'];
    return this.maintenanceRealizationService.createItem(createMaintenanceRealizationItemDto);
  }

  @Post('requestApproval/:id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance realizations')
  @ApiBearerAuth()
  requestApproval(@Param('id') id: string) {
    return this.maintenanceRealizationService.createApproval(id);
  }

  @Post('/approve')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance realizations')
  @ApiBearerAuth()
  approve(@Body() createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto, @Req() req: Request) {
    createMaintenancePlanApproveDto.idUser = req.user['sub'];
    return this.maintenanceRealizationService.approveMaintenance(createMaintenancePlanApproveDto);
  }

  @Post('/reject')
  @UseGuards(DatabaseAccessGuard)
  @ApiBearerAuth()
  reject(@Body() createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto, @Req() req: Request) {
    createMaintenancePlanApproveDto.idUser = req.user['sub'];
    return this.maintenanceRealizationService.rejectMaintenance(createMaintenancePlanApproveDto);
  }

  @Get()
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance realizations')
  @ApiBearerAuth()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<Pagination<MaintenanceRealisation>> {
    const options: IPaginationOptions = { limit, page };
    return await this.maintenanceRealizationService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance realizations')
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user['sub'];
    return this.maintenanceRealizationService.findOne(id, userId);
  }

  @Delete('/item/:id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:maintenance realizations')
  @ApiBearerAuth()
  removeItem(@Param('id') id: string) {
    return this.maintenanceRealizationService.removeItem(id);
  }
}
