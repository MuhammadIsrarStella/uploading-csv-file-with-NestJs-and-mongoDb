import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileProcessor } from '../interfaces/file-processor.interface';
import { ExcelFileProcessor } from './strategies/excel-file-processor.strategy';
import { ExcelFileData, ExcelFileDataDocument } from '../schema/excel-file.schema';

@Injectable()
export class FileProcessingFactory {
  constructor(
    @InjectModel(ExcelFileData.name) private readonly excelFileDataModel: Model<ExcelFileDataDocument>
  ) {}

  createProcessor(type: string): FileProcessor {
    switch (type) {
      case 'excel':
        return new ExcelFileProcessor(this.excelFileDataModel);
      default:
        throw new InternalServerErrorException('Unsupported file type');
    }
  }
}
