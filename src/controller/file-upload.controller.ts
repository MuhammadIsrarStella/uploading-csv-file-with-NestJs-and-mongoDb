
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFilterPipe } from '../custom-file-decorator/file-filter.decorator';
import { FileUploadService } from 'src/services/strategies/FileUploadService';
import { UploadFileDto } from 'src/dto/upload-file.dto';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV or Excel file upload',
    type: UploadFileDto,
  })
  @UsePipes(FileFilterPipe)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response
  ) {
    try {
      const jsonData = await this.fileUploadService.handleFileUpload(file, 'POST');
      return res.status(HttpStatus.OK).json(jsonData);
    } catch (error) {
      error.response.path = res.req.url;
      return res.status(error.status).json(error.response);
    }
  }
}
