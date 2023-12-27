import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { RepairmentService } from './repairment.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

import { Repairment } from './entities/repairment.entity';
import { CreateRepairmentDto } from './dto/create-repairment.dto';
import { UpdateRepairmentDto } from './dto/update-repairment.dto';
import { CreateRepairmentApprovalsDto } from './dto/approvals.dto';
import { UpdateRepairmentApprovalsDto } from './dto/update-approvals.dto';

import { editFileName } from '../upload/utils/upload.util';
import { ALLOWED_EXT, API_BODY_FILES_SCHEMA, MAX_PHOTO_COUNT, MAX_PHOTO_SIZE } from '../damage-reporting/constants';
import { UploadService } from '../upload/upload.service';

@Controller('repairment')
@ApiTags('Repairment')
export class RepairmentController {
  constructor(private readonly repairmentService: RepairmentService, private readonly uploadService: UploadService) {}

  @Get()
  @ApiOperation({ summary: 'Get all repairments' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:laporan perbaikan')
  @ApiBearerAuth()
  async getRepairments(
    @Req() request: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<Pagination<Repairment>> {
    try {
      const options: IPaginationOptions = {
        limit,
        page,
        route: request.route.path,
      };
      const repairments = await this.repairmentService.paginate(options);
      return repairments;
    } catch (err) {
      console.log(err);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repairment by id' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:laporan perbaikan')
  @ApiBearerAuth()
  async getRepairmentById(@Param('id') id: string) {
    try {
      return this.repairmentService.getRepairmentById(id);
    } catch (err) {
      console.log(err);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create repairment' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan perbaikan')
  @ApiBearerAuth()
  async createRepairment(@Body() createRepairmentDto: CreateRepairmentDto) {
    try {
      return await this.repairmentService.createRepairment(createRepairmentDto);
    } catch (err) {
      console.log({ err });
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update repairment' })
  @ApiBody({ type: UpdateRepairmentDto })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:laporan perbaikan')
  @ApiBearerAuth()
  async updateRepairment(@Param('id') id: string, @Body() updateRepairmentDto: UpdateRepairmentDto) {
    try {
      return await this.repairmentService.updateRepairment(id, updateRepairmentDto);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete repairment' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:laporan perbaikan')
  @ApiBearerAuth()
  async deleteRepairment(@Param('id') id: string) {
    try {
      return await this.repairmentService.deleteRepairment(id);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload repairment file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(API_BODY_FILES_SCHEMA)
  @UseInterceptors(
    FilesInterceptor('files', MAX_PHOTO_COUNT, {
      storage: diskStorage({
        destination: './storage/files/',
        filename: editFileName,
      }),
    })
  )
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan perbaikan')
  @ApiBearerAuth()
  async upload(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: ALLOWED_EXT,
        })
        .addMaxSizeValidator({
          maxSize: MAX_PHOTO_SIZE, // 1mb
        })
        .build({ fileIsRequired: true })
    )
    files: Express.Multer.File[]
  ) {
    try {
      const results = await this.uploadService.uploadFiles(files);
      return await this.repairmentService.saveUploadedFiles(id, results);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Delete(':fileId/upload')
  @ApiOperation({ summary: 'Delete repairment file' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:laporan perbaikan')
  @ApiBearerAuth()
  async deleteUpload(@Param('fileId') fileId: string) {
    try {
      const file = await this.repairmentService.findFile(fileId);
      const filepath = 'storage/files/' + file.photo;
      const deletedResult = await this.uploadService.deleteFile(filepath);
      if (!deletedResult) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      const removedFilesRef = await this.repairmentService.removeFileRefs(fileId);
      if (removedFilesRef.affected !== 1) {
        throw new HttpException('File is not deleted', HttpStatus.NOT_MODIFIED);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'File is deleted',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve repairment' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan perbaikan')
  @ApiBearerAuth()
  async approveRepairment(@Param('id') id: string, @Body() approvalsDto: CreateRepairmentApprovalsDto) {
    try {
      return await this.repairmentService.approveRepairment(id, approvalsDto);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Update repairment approvals' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:laporan perbaikan')
  @ApiBearerAuth()
  async updateApproval(@Param('id') id: string, @Body() approvalsDto: UpdateRepairmentApprovalsDto) {
    try {
      return await this.repairmentService.updateRepairmentApproval(id, approvalsDto);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Get('report/pdf')
  @ApiOperation({ summary: 'Get repairment report' })
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:laporan perbaikan')
  @ApiBearerAuth()
  async generatePdf(@Query('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.repairmentService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-disposition': 'inline; filename=report_repairment.pdf',
    });

    // send the PDF as the response
    res.send(pdfBuffer);
  }
}
