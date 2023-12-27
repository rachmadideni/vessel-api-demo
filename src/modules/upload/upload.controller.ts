import { Controller, UploadedFiles, Get, Post, Param, Res, UseInterceptors, StreamableFile, ParseFilePipeBuilder } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import { editFileName } from './utils/upload.util';
import { join } from 'path';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { ALLOWED_EXT, MAX_PHOTO_SIZE } from '../damage-reporting/constants';
@Controller('upload')
@ApiTags('Upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post('')
  @ApiOperation({ summary: 'Upload files example (do not use this)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        /*
          files: {
          // 👈 this property name (image) must matches with the FileInterceptor
          type: 'string',
          format: 'binary',
        },
        */
        // swagger request body
        files: {
          // 👈 this property name (files) must matches with the 1st parameter of FilesInterceptor
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './storage/files/',
        filename: editFileName,
      }),
    })
  )
  async uploadMultipleFiles(
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
    const uploadFileNames = await this.uploadService.uploadFiles(files);
    return uploadFileNames;
  }

  // serve on static folder
  @Get(':filename')
  @ApiOperation({ summary: 'view file' })
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(filename, { root: join(process.cwd(), 'storage/files') }); // or use it like { root: './storage/files' }
  }

  // used for downloading file
  @Get(':filename/download')
  @ApiOperation({ summary: 'Download file' })
  getStreamableFile(@Param('filename') filename: string): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'storage/files', filename));
    return new StreamableFile(file);
  }
}
