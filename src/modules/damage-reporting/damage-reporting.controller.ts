import {
  Req,
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  UploadedFiles,
  HttpStatus,
  HttpException,
  UseInterceptors,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseFilePipeBuilder,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { DamageReportingService } from './damage-reporting.service';
import { UploadService } from '../upload/upload.service';
import { DamageReport } from './entities/damage-report.entity';
import { CreateDamageFormDto } from './dto/create-damage-form.dto';
import { UpdateDamageFormDto } from './dto/update-damage-form.dto';
import {
  editFileName,
  // imageFileFilter
} from '../upload/utils/upload.util';
import { ALLOWED_EXT, API_BODY_FILES_SCHEMA, MAX_PHOTO_SIZE, MAX_PHOTO_COUNT } from './constants';
import MSG from './messages';
// import { ApprovalsDto } from './dto/approvals.dto';
import { CreateApprovalsDto } from './dto/create-approval.dto';
import { UpdateDmrApprovalsDto } from './dto/update-approvals.dto';

@Controller('damage')
@ApiTags('Damage Reporting')
export class DamageReportingController {
  constructor(private readonly damageReportingService: DamageReportingService, private readonly uploadService: UploadService) {}
  @Post('form')
  @ApiOperation({ summary: MSG.CREATE_DAMAGE_SUMMARY })
  @ApiBody({ type: CreateDamageFormDto })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan kerusakan')
  @ApiBearerAuth()
  async create(@Body() createDamageFormDto: CreateDamageFormDto) {
    const report = await this.damageReportingService.create(createDamageFormDto);
    if (!report.id) {
      throw new HttpException(MSG.CREATE_DAMAGE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return report;
  }

  @Post('form/:id/upload')
  @ApiOperation({ summary: MSG.UPLOAD_DAMAGE_SUMMARY })
  @ApiConsumes('multipart/form-data')
  @ApiBody(API_BODY_FILES_SCHEMA)
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan kerusakan')
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('files', MAX_PHOTO_COUNT, {
      storage: diskStorage({
        destination: './storage/files/',
        filename: editFileName,
      }),
    })
  )
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
      return await this.damageReportingService.saveUploadedFormFiles(id, results);
    } catch (err) {
      throw new HttpException(MSG.UPLOAD_DAMAGE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('form/:fileId/upload')
  @ApiOperation({ summary: MSG.DELETE_DAMAGE_FILE_SUMMARY })
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:laporan kerusakan')
  @ApiBearerAuth()
  async deleteUpload(@Param('fileId') fileId: string) {
    try {
      const file = await this.damageReportingService.findFile(fileId);
      const filepath = 'storage/files/' + file.photo;
      const deletedResult = await this.uploadService.deleteFile(filepath);
      if (!deletedResult) {
        throw new HttpException(MSG.DELETE_DAMAGE_FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const removedFilesRef = await this.damageReportingService.removeFileRefs(fileId);
      if (removedFilesRef.affected !== 1) {
        throw new HttpException(MSG.DELETE_DAMAGE_FILE_ERROR_REFS, HttpStatus.NOT_MODIFIED);
      }

      return {
        statusCode: HttpStatus.OK,
        message: MSG.DELETE_DAMAGE_FILE_SUCCESS,
      };
    } catch (err) {
      throw new HttpException(MSG.DELETE_DAMAGE_FILE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('form')
  @ApiOperation({ summary: MSG.GET_DAMAGE_FORMS_SUMMARY })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:laporan kerusakan')
  @ApiBearerAuth()
  async getForms(
    @Req() request: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<Pagination<DamageReport>> {
    try {
      const options: IPaginationOptions = {
        limit,
        page,
        route: request.route.path,
      };
      const formResults = await this.damageReportingService.paginate(options);
      if (!formResults) throw new HttpException(MSG.GET_DAMAGE_FORMS_ERROR, HttpStatus.NOT_FOUND);
      return formResults;
    } catch (err) {
      throw new HttpException(MSG.GET_DAMAGE_FORMS_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('form/:id')
  @ApiOperation({ summary: MSG.GET_DAMAGE_DETAILS_SUMMARY })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:laporan kerusakan')
  @ApiBearerAuth()
  async getForm(@Param('id') id: string) {
    return this.damageReportingService.getForm(id);
  }

  @Delete('form/:id')
  @ApiOperation({ summary: MSG.DELETE_DAMAGE_FORM_SUMMARY })
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:laporan kerusakan')
  @ApiBearerAuth()
  async deleteForm(@Param('id') id: string) {
    try {
      const isDeleted = await this.damageReportingService.deleteForm(id);
      if (isDeleted.affected !== 1) throw new HttpException(MSG.DELETE_DAMAGE_FORM_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
      return {
        statusCode: HttpStatus.OK,
        message: MSG.DELETE_DAMAGE_FORM_SUCCESS,
      };
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('form/:id')
  @ApiOperation({ summary: MSG.UPDATE_DAMAGE_FORM_SUMMARY })
  @ApiBody({ type: UpdateDamageFormDto })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:laporan kerusakan')
  @ApiBearerAuth()
  async updateForm(@Param('id') id: string, @Body() updateDamageFormDto: UpdateDamageFormDto) {
    try {
      const updatedResult = await this.damageReportingService.updateForm(id, updateDamageFormDto);
      if (!updatedResult) throw new HttpException(MSG.UPDATE_DAMAGE_FORM_ERROR, HttpStatus.NOT_MODIFIED);
      return {
        statusCode: HttpStatus.OK,
        message: MSG.UPDATE_DAMAGE_FORM_SUCCESS,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
      // throw new HttpException(MSG.UPDATE_DAMAGE_FORM_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report/pdf')
  @ApiOperation({ summary: MSG.GENERATE_DAMAGE_REPORT_SUMMARY })
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:laporan kerusakan')
  @ApiBearerAuth()
  async generatePdf(@Query('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.damageReportingService.generatePDF(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      // 'Content-Disposition': 'attachment; filename=report_damage_form.pdf',
      'Content-disposition': 'inline; filename=report_damage_form.pdf',
    });

    // send the PDF as the response
    res.send(pdfBuffer);
  }

  @Get('list/forms')
  @ApiOperation({ summary: MSG.GET_FORMS_SUMMARY })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:laporan kerusakan')
  @ApiBearerAuth()
  async getAllForms(@Req() request: Request) {
    // check request object and gets the shipId and role
    // TODO: this should be handled by custom decorators
    const users = Object.keys(request.user)
      .filter((item) => item === 'shipId' || item === 'role')
      .map((key) => ({ [key]: request.user[key] }));

    return this.damageReportingService.getAllForms(users);
  }

  // approvals
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve Damage Report' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:laporan kerusakan')
  @ApiBearerAuth()
  async approve(@Param('id') id: string, @Body() approvalsDto: CreateApprovalsDto) {
    try {
      return await this.damageReportingService.approve(id, approvalsDto);
    } catch (err) {}
  }

  // update approvals
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Update Damage Report Approvals' })
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:laporan kerusakan')
  @ApiBearerAuth()
  async updateApprovals(@Param('id') id: string, @Body() updateApprovalsDto: UpdateDmrApprovalsDto) {
    try {
      return await this.damageReportingService.updateApprovals(id, updateApprovalsDto);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }
}
