import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  HttpException,
  HttpStatus,
} from '@nestjs/common';


@Injectable()
export class FileFilterPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom') {
      const allowedMimeTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-excel', 
      ];

      if (!allowedMimeTypes.includes(value.mimetype)) {
        throw new HttpException(
          'Invalid file format. Only CSV and Excel files are allowed.',
          HttpStatus.BAD_REQUEST
        );
      }
    }
    return value;
  }
}
