import { Module } from "@nestjs/common";
import { FileUploadController } from "../controller/file-upload.controller";
import { FileFilterService } from "../file-filter/file-filter-service";
import { ExcelFileUploadService } from "../services/Excel-file-upload-service";
import { FileProcessingFactory } from "../services/File-processing-factory";
import { ExcelFileProcessor } from "../services/strategies/excel-file-processor.strategy";
import { FileUploadService } from "../services/strategies/FileUploadService";


@Module({
  providers: [
    ExcelFileUploadService,
    FileProcessingFactory,
    ExcelFileProcessor,
    FileFilterService,
    FileUploadService,
  ],
  controllers: [FileUploadController],
})
export class FileProcessingModule {}
