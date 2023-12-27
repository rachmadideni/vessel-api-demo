import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { FileFilterCallback } from 'multer';

@Injectable()
export class FileSizePipe implements PipeTransform {
  transform(value: any) {
    const fileFilter = (files: Express.Multer.File[], callback: FileFilterCallback) => {
      if (!files || files.length === 0) {
        callback(new BadRequestException('No files uploaded'));
        return;
      }

      // Handle both single file and multiple files
      //   const uploadedFiles = Array.isArray(files) ? files : [files];

      //   const oversizedFiles = uploadedFiles.filter((file) => file.size > 1000000);
      //   if (oversizedFiles.length > 0) {
      //     callback(new BadRequestException('File size exceeded'));
      //     return;
      //   }

      callback(null, true);
    };
    return fileFilter;
  }
}
