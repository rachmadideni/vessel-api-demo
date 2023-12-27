import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  async uploadFiles(files: Express.Multer.File[]) {
    const uploadFileNames: Express.Multer.File[] = [];
    for (const file of files) {
      uploadFileNames.push(file);
    }
    return uploadFileNames;
  }

  async deleteFile(filepath: string): Promise<string> {
    try {
      await fs.promises.unlink(filepath);
      return 'File deleted from storage';
    } catch (err) {
      throw new HttpException(err.message, err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
