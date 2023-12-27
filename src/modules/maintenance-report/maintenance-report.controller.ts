import { Controller, Get, Post, Param, Query, DefaultValuePipe, ParseIntPipe, Req, Res, UseGuards, ParseEnumPipe, HttpException, StreamableFile } from '@nestjs/common';
import { ApiProperty, ApiOperation, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Request } from 'express';
import { MaintenanceReportsDto } from './dto/maintenance-reports.dto';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { MaintenanceReportService } from './maintenance-report.service';

import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

import { maintenancePeriod } from 'src/common/dto/maintenancePeriod.dto';

@Controller('maintenance-report')
@ApiTags('Maintenance report')
export class MaintenanceReportController {
  constructor(private readonly maintenanceReportService: MaintenanceReportService) {}

  @Get('')
  @ApiOperation({ summary: 'maintenance report' })
  @ApiQuery({
    name: 'vesselId',
    required: false,
  })
  @ApiQuery({
    name: 'maintenancePeriod',
    required: false,
  })
  @ApiQuery({
    name: 'formDate',
    required: false,
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance reports')
  @ApiBearerAuth()
  async maintenanceReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('vesselId') vesselId?: string,
    @Query('maintenancePeriod') maintenancePeriod?: maintenancePeriod | null,
    @Query('formDate') formDate?: string
  ): Promise<Pagination<MaintenanceRealisation>> {
    const options: IPaginationOptions = { limit, page };

    const filters = {
      vesselId,
      maintenancePeriod,
      formDate,
    };

    return await this.maintenanceReportService.maintenanceReports(options, { ...filters });
  }

  @Get(':id')
  @ApiOperation({ summary: 'maintenance report detail' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:maintenance reports')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    // , @Req() req: Request
    // console.log(req);
    // const userId = req.user['sub'];
    return this.maintenanceReportService.findOne(id);
  }

  @Get('/pdf/:id')
  @ApiOperation({ summary: 'Get maintenance report PDF' })
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:Maintenance reports')
  @ApiBearerAuth()
  async generatePdf(@Param('id') id: string, @Res() res) {
    try {
      const pdfBuffer = await this.maintenanceReportService.generatePDF(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-disposition': 'inline; filename=report_maintenance.pdf',
      });

      res.send(pdfBuffer);
    } catch (err) {
      throw err;
    }
  }

  @Get(':id/plan-realisasi')
  @ApiOperation({ summary: 'plan vs realita 😞' })
  @ApiBearerAuth()
  planRealisasi(@Param('id') id: string) {
    return this.maintenanceReportService.planRealisasi(id);
  }

  @Get(':id/plan-realisasi/pdf')
  @ApiOperation({ summary: 'Get Plan Realisation PDF 😞' })
  @ApiBearerAuth()
  async generatePlanRealisationPdf(@Param('id') id: string, @Res() res) {
    try {
      const pdfBuffer = await this.maintenanceReportService.generatePlanRealisationPDF(id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-disposition': 'inline; filename=report_maintenance_plan_realisation.pdf',
      });
      res.send(pdfBuffer);
    } catch(err) {
      throw err;
    }
  }
}
