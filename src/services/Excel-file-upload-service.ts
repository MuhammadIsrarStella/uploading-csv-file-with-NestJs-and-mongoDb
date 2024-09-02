
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileData, ExcelFileDataDocument } from 'src/schema/excel-file-data';
import { ExcelFileProcessor } from './strategies/excel-file-processor.strategy';
import { ProcessedData } from '../interfaces/Processed-data';

@Injectable()
export class ExcelFileUploadService {
  constructor(
    @InjectModel(ExcelFileData.name) private excelFileDataModel: Model<ExcelFileDataDocument>,
    private readonly excelFileProcessor: ExcelFileProcessor
  ) {}

  async processNewFile(buffer: Buffer): Promise<ProcessedData[]> {
    return await this.excelFileProcessor.processingFile(buffer);
  }

 
}
