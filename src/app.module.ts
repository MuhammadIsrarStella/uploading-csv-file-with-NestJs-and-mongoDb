
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ExcelFileData, ExcelFileDataSchema } from './schema/Excel-file-data';
import { ExcelFileUploadService } from './services/Excel-file-upload-service';
import { FileProcessingFactory } from './services/File-processing-factory';
import { FileUploadController } from './controller/file-upload.controller';
import { ExcelFileProcessor } from './services/strategies/excel-file-processor.strategy';
import { FileFilterService } from './file-filter/file-filter-service';

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
    MongooseModule.forFeature([{ name: ExcelFileData.name, schema: ExcelFileDataSchema }]),
  ],
  providers: [ExcelFileUploadService, FileProcessingFactory, ExcelFileProcessor, FileFilterService],
  controllers: [FileUploadController],
})
export class AppModule {}
