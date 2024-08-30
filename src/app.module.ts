
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ExcelFileUploadService } from './services/Excel-file-upload-service';
import { FileProcessingFactory } from './services/File-processing-factory';
import { ExcelFileProcessor } from './services/strategies/excel-file-processor.strategy';
import { FileUploadController } from './controller/file-upload.controller';
import { FileUploadService } from './services/strategies/FileUploadService';
import { FileFilterService } from './file-filter/file-filter-service';
import { ExcelFileData, ExcelFileDataSchema } from './schema/Excel-file-data';
import { PatientVisitService } from './services/Patient-visit-service';
import { Patient, PatientSchema } from './schema/patient-schema';
import { Visit, VisitSchema } from './schema/visit-schema';
import { PatientVisitMergedService } from './services/patient-visit-records-merged';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: ExcelFileData.name, schema: ExcelFileDataSchema }
    ]),
  ],
  providers: [
    ExcelFileUploadService,
    FileProcessingFactory,
    ExcelFileProcessor,
    FileFilterService,
    FileUploadService,
    PatientVisitService,
    PatientVisitMergedService
  ],
  controllers: [FileUploadController],
})
export class AppModule {}
