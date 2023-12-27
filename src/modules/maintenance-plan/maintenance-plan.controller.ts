import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe, Delete, UseGuards, Patch, Res, Req } from '@nestjs/common';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { MaintenanceRealisation } from './entities/maintenance-realisation.entity';
import { CreateMaintenancePlanItemDto } from './dto/create-maintenance-plan-item.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { MaintenancePlanService } from './maintenance-plan.service';
import { Request } from 'express';
import { ApprovalService } from '../approval/approval.service';
import { CreateMaintenancePlanApproveDto } from './dto/create-maintenance-plan-approve.dto';
import { MaintenanceReportsDto } from './dto/maintenance-reports.dto';

@Controller('maintenance-plan')
@ApiTags('Maintenance plan')
export class MaintenancePlanController {
  constructor(private readonly maintenancePlanService: MaintenancePlanService, private readonly approvalService: ApprovalService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance plans')
  @ApiBearerAuth()
  create(@Body() createMaintenanceRealisationDto: CreateMaintenancePlanDto, @Req() req: Request) {
    return this.maintenancePlanService.create(createMaintenanceRealisationDto);
  }

  @Post('/item')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance plans')
  @ApiBearerAuth()
  createItem(@Body() createMaintenanceRealisationItemDto: CreateMaintenancePlanItemDto) {
    return this.maintenancePlanService.createItem(createMaintenanceRealisationItemDto);
  }

  @Post('/approve')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance plans')
  @ApiBearerAuth()
  approve(@Body() createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto, @Req() req: Request) {
    createMaintenancePlanApproveDto.idUser = req.user['sub'];
    return this.maintenancePlanService.approveMaintenance(createMaintenancePlanApproveDto);
  }

  @Post('/reject')
  @UseGuards(DatabaseAccessGuard)
  @ApiBearerAuth()
  reject(@Body() createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto, @Req() req: Request) {
    createMaintenancePlanApproveDto.idUser = req.user['sub'];
    return this.maintenancePlanService.rejectMaintenance(createMaintenancePlanApproveDto);
  }

  @Get()
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance plans')
  @ApiBearerAuth()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<Pagination<MaintenanceRealisation>> {
    const options: IPaginationOptions = { limit, page };
    return await this.maintenancePlanService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance plans')
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user['sub'];
    return this.maintenancePlanService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:maintenance plans')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateMaintenanceRealisationDto: UpdateMaintenancePlanDto) {
    return this.maintenancePlanService.update(id, updateMaintenanceRealisationDto);
  }

  @Delete('/item/:id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:maintenance plans')
  @ApiBearerAuth()
  removeItem(@Param('id') id: string) {
    return this.maintenancePlanService.removeItem(id);
  }

  @Get('/report/generatePdf')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance plans')
  @ApiBearerAuth()
  async generatePdf(@Query('id') id: string, @Res() res) {
    const pdfBuffer = await this.maintenancePlanService.generatePDF(id);
    // set the response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      // 'Content-Disposition': 'attachment; filename=report_maintenance.pdf',
      'Content-disposition': 'inline; filename=report_maintenance.pdf',
    });

    // send the PDF as the response
    res.send(pdfBuffer);
  }

  @Post('/report')
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:maintenance plans')
  @ApiBearerAuth()
  async report(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Body() body: MaintenanceReportsDto
  ): Promise<Pagination<MaintenanceRealisation>> {
    const options: IPaginationOptions = { limit, page };
    return await this.maintenancePlanService.maintenanceReports(options, body);
  }
}
