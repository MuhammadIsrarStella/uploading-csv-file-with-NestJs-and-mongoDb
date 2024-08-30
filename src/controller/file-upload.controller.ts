import {
  Controller,
  Post,
  Get, 
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
import { PatientVisitMergedService } from 'src/services/patient-visit-records-merged';

@Controller('file-upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly mergePatientVisitService: PatientVisitMergedService, 
  ) {}

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
      const result = await this.fileUploadService.handleFileUpload(file, 'POST');
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      error.response.path = res.req.url;
      return res.status(error.status).json(error.response);
    }
  }

  @Get('/patient-visit/merged-records')
  async getMergedPatientRecords(@Res() res: Response) {
    try {
    const mergedRecords = await this.mergePatientVisitService.getMergedPatientVisitRecords();
    console.log("Merged Records are",JSON.stringify(mergedRecords, null, 2));
      return res.status(HttpStatus.OK).json(mergedRecords);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve patient records',
        error: error.message,
      });
    }
  }
}
