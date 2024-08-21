
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FileFilterService } from '../file-filter/file-filter-service';

@Injectable()
export class FileFilterPipe implements PipeTransform {
  constructor(private readonly fileFilterService: FileFilterService) {}

  transform(file: Express.Multer.File): any {
    try {
      this.fileFilterService.validateFileType(file);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
    return file;
  }
}
