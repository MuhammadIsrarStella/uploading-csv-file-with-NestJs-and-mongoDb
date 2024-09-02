import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileProcessor } from '../interfaces/File-processor';
import { ExcelFileProcessor } from './strategies/excel-file-processor.strategy';
import { ExcelFileData, ExcelFileDataDocument } from '../schema/excel-file-data';
import { PatientVisitService } from './Patient-visit-service';

@Injectable()
export class FileProcessingFactory {
  constructor(
    @InjectModel(ExcelFileData.name) private readonly excelFileDataModel: Model<ExcelFileDataDocument>,
    private readonly patientVisitService: PatientVisitService, 
  ) {}

  createProcessor(type: string): FileProcessor {
    switch (type) {
      case 'excel':
        return new ExcelFileProcessor(this.excelFileDataModel, this.patientVisitService);
      default:
        throw new InternalServerErrorException('Unsupported file type');
    }
  }
}
