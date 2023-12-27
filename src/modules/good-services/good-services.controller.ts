import { Body, Controller, Post, HttpException, HttpStatus, Get, Param, Patch, Delete, Query, DefaultValuePipe, ParseIntPipe, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

import { GoodServicesService } from './good-services.service';
import { CreateGoodServicesDto } from './dto/create-good-services.dto';
import { UpdateGoodServicesDto } from './dto/update-good-services.dto';
import { GsApprovalsDto } from './dto/approvals.dto';
import { UpdateGsApprovalsDto } from './dto/update-approvals.dto';
import { BadRequestResponse, InternalServerError, NotFoundResponse } from './dto/error-response.dto';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { GoodServices } from './entities/good-services.entity';

@Controller('good-services')
@ApiTags('Good Services')
export class GoodServicesController {
  constructor(private readonly goodServicesService: GoodServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all good services' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:form pengadaan barang & jasa')
  @ApiBearerAuth()
  async getAll(
    @Req() request: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<Pagination<GoodServices>> {
    try {
      const users = Object.keys(request.user)
        .filter((item) => item === 'shipId' || item === 'role')
        .map((key) => ({ [key]: request.user[key] }));

      const options: IPaginationOptions = {
        limit,
        page,
        route: request.route.path,
      };
      const goodServices = await this.goodServicesService.paginate(options, users);
      return goodServices;
    } catch (err) {
      console.log(err);
    }
  }

  @Post('')
  @ApiOperation({ summary: 'Create good services' })
  @ApiBody({ type: CreateGoodServicesDto })
  @ApiResponse({
    type: CreateGoodServicesDto,
    status: HttpStatus.CREATED,
  })
  @ApiResponse({
    status: BadRequestResponse.statusCode,
    description: 'Bad Request',
    schema: {
      example: { ...BadRequestResponse },
    },
  })
  @ApiResponse({
    status: InternalServerError.statusCode,
    description: InternalServerError.error,
    schema: {
      example: { ...InternalServerError },
    },
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:form pengadaan barang & jasa')
  @ApiBearerAuth()
  async create(@Body() createGoodServicesDto: CreateGoodServicesDto, @Req() req: Request) {
    try {
      const userIdFromToken = req.user['sub'];
      const created = await this.goodServicesService.create(createGoodServicesDto, userIdFromToken);
      if (!created) throw new HttpException('Error creating good services', HttpStatus.INTERNAL_SERVER_ERROR);
      return await this.goodServicesService.findById(created.id);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:id')
  @ApiOperation({ summary: 'view good services details' })
  @ApiResponse({
    status: BadRequestResponse.statusCode,
    description: 'Bad Request',
    schema: {
      example: { ...BadRequestResponse },
    },
  })
  @ApiResponse({
    status: NotFoundResponse.statusCode,
    description: NotFoundResponse.error,
    schema: {
      example: { ...NotFoundResponse },
    },
  })
  @ApiResponse({
    status: InternalServerError.statusCode,
    description: InternalServerError.error,
    schema: {
      example: { ...InternalServerError },
    },
  })
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:form pengadaan barang & jasa')
  // @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    try {
      return this.goodServicesService.findById(id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete good services' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:form pengadaan barang & jasa')
  @ApiBearerAuth()
  async deleteGoodServices(@Param('id') id: string) {
    try {
      const deleted = await this.goodServicesService.deleteGoodServices(id);
      if (deleted.affected !== 1) throw new HttpException('Error deleting good services', HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update good services' })
  @ApiBody({ type: UpdateGoodServicesDto })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:form pengadaan barang & jasa')
  @ApiBearerAuth()
  async updateGoodServices(@Param('id') id: string, @Body() updateGoodServicesDto: UpdateGoodServicesDto) {
    try {
      await this.goodServicesService.updateGoodServices(id, updateGoodServicesDto);
      return await this.goodServicesService.findById(id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve good services' })
  @Permission('create:form pengadaan barang & jasa')
  @UseGuards(DatabaseAccessGuard)
  @ApiBearerAuth()
  async approve(@Param('id') id: string, @Body() approvalsDto: GsApprovalsDto) {
    try {
      return await this.goodServicesService.approve(id, approvalsDto);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Update Good services Approvals' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:form pengadaan barang & jasa')
  @ApiBearerAuth()
  async updateApprovals(@Param('id') id: string, @Body() updateApprovalsDto: UpdateGsApprovalsDto) {
    try {
      return await this.goodServicesService.updateApprovals(id, updateApprovalsDto);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report/pdf')
  @ApiOperation({ summary: 'Generate PDF good services' })
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:form pengadaan barang & jasa')
  // @ApiBearerAuth()
  async generatePdf(@Query('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.goodServicesService.generatePDF(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      // 'Content-Disposition': 'attachment; filename=report_damage_form.pdf',
      'Content-disposition': 'inline; filename=form_pengadaan_barang_jasa.pdf',
    });

    // send the PDF as the response
    res.send(pdfBuffer);
  }
}
