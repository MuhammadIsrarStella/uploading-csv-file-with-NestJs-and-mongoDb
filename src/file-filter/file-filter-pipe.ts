
import { Injectable, PipeTransform, ArgumentMetadata, Inject } from '@nestjs/common';
import { FileFilterService } from './file-filter-service';

@Injectable()
export class FileFilterPipe implements PipeTransform {
  constructor(@Inject(FileFilterService) private readonly fileFilterService: FileFilterService) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom') {
      const file = value as Express.Multer.File;
      this.fileFilterService.validateFileType(file);
    }
    return value;
  }
}
