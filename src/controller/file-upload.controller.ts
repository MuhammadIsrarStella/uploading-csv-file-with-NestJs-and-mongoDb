
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../dto/upload-file.dto';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ExcelFileUploadService } from '../services/Excel-file-upload-service';
import { FileFilterPipe } from '../custom-file-decorator/file-filter.decorator';


@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly excelFileUploadService: ExcelFileUploadService) {}
  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV or Excel file upload',
    type: UploadFileDto,
  })
  @UsePipes(FileFilterPipe)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const jsonData = await this.excelFileUploadService.uploadFile(file.buffer);
      return jsonData;
    } catch (error) {
      throw new BadRequestException('Failed to process the file');
    }
  }
}

