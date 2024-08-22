
// import * as XLSX from 'xlsx';
// import { Injectable } from '@nestjs/common';
// import { FileProcessor } from '../../interfaces/File-processor';
// import { DataObject, ProcessedData } from '../../interfaces/Processed-data';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { ExcelFileData, ExcelFileDataDocument } from '../../schema/Excel-file-data';
// import { plainToInstance } from 'class-transformer';
// import { validate } from 'class-validator';
// import { ExcelFileProcessingException, InvalidHeaderException } from '../../exceptions/excel-file-processing.exception';
// import { ProcessedDataDto } from '../../dto/Processed-data-dto';
// import { PatientVisitService } from '../Patient-visit-service';

// @Injectable()
// export class ExcelFileProcessor implements FileProcessor {
//   constructor(
//     @InjectModel(ExcelFileData.name) private readonly excelFileDataModel: Model<ExcelFileDataDocument>,
//     private readonly patientVisitService: PatientVisitService,
//   ) {}

//   async processingFile(buffer: Buffer): Promise<ProcessedData[]> {
//     const workbook = XLSX.read(buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];

//     // Use stream reading for large files
//     const worksheetStream = XLSX.stream.to_json(workbook.Sheets[sheetName], { header: 1 });

//     let headers: string[] = [];
//     const processedData: ProcessedData[] = [];

//     let rowIndex = 0;
//     for await (const row of worksheetStream) {
//       if (rowIndex === 0) {
//         headers = row;
//         this.validateHeaders(headers);
//       } else {
//         if (!this.isRowEmpty(row)) {
//           const data = this.transformRowToProcessedData(row, headers);
//           await this.patientVisitService.updatePatientAndVisit(data);
//           await this.storeDataInSchema(data);
//           processedData.push(data);
//         }
//       }
//       rowIndex++;
//     }

//     return processedData;
//   }

//   private validateHeaders(headers: string[]): void {
//     const requiredHeaders = ['MRN', 'BranchCode', 'form', 'admitDate'];
//     const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

//     if (missingHeaders.length > 0) {
//       throw new InvalidHeaderException(missingHeaders);
//     }
//   }

//   private transformRowToProcessedData(row: string[], headers: string[]): ProcessedData {
//     const data = this.mapRowToDataObject(row, headers);

//     const fullName = this.sanitizeInput(data['patient'] as string || '');
//     const [firstName, lastName] = this.splitFullName(fullName);

//     let visitDate = this.formatDate(this.sanitizeInput(data['admitDate'] as string || ''));
//     if (!visitDate) {
//       visitDate = new Date().toISOString().split('T')[0]; 
//     }

//     const processedData = {
//       fullName,
//       firstName,
//       lastName,
//       mrn: this.sanitizeInput(data['MRN'] as string || ''),
//       charStatus: this.sanitizeInput(data['chart_status'] as string || ''),
//       payerSourceName: this.sanitizeInput(data['PayorSourceName'] as string || ''),
//       branchCode: this.sanitizeInput(data['BranchCode'] as string || ''),
//       visitType: this.sanitizeInput(data['form'] as string || ''),
//       status: this.sanitizeInput(data['form_status'] as string || ''),
//       visitDate,
//       ZipCode: this.sanitizeInput(data['blink'] as string || '00000'),
//       HCHB_calculation: this.handleNullOrEmpty(this.sanitizeInput(data['VisitCntAll'] as string || undefined)),
//       total_pmt: this.handleNullOrEmpty(this.sanitizeInput(data['Timing'] as string || undefined)),
//       icdCodes: this.extractIcdCodes(data),
//       questionnaire: this.extractQuestionnaire(data, headers, row),
//     };

//     this.validateProcessedData(processedData);
//     return processedData;
//   }

//   private async storeDataInSchema(data: ProcessedData): Promise<void> {
//     try {
//       const newExcelFileData = new this.excelFileDataModel(data);
//       await newExcelFileData.save();
//     } catch (error) {
//       throw new ExcelFileProcessingException(`Failed to save data: ${error.message}`);
//     }
//   }

//   private mapRowToDataObject(row: string[], headers: string[]): DataObject {
//     return headers.reduce((acc: DataObject, header: string, index: number) => {
//       acc[header] = this.handleNullOrEmpty(this.sanitizeInput(row[index] || ''));
//       return acc;
//     }, {} as DataObject);
//   }

//   private formatDate(date: string): string {
//     if (!date) {
//       return '';  
//     }

//     const parsedDate = new Date(date);

//     if (isNaN(parsedDate.getTime())) {
//       throw new ExcelFileProcessingException(`Invalid date format: ${date}`);
//     }

//     return parsedDate.toISOString().split('T')[0];
//   }

//   private async validateProcessedData(data: any): Promise<void> {
//     const dto = plainToInstance(ProcessedDataDto, data);
//     const errors = await validate(dto);
//     if (errors.length > 0) {
//       throw new ExcelFileProcessingException(`Validation failed: ${errors.toString()}`);
//     }
//   }

//   private extractValues(data: DataObject, start: number, end: number, prefix: string, booleanCheck: boolean): (string | number)[] {
//     const values: (string | number)[] = [];
//     for (let i = start; i <= end; i++) {
//       const key = `${prefix}(${i})`;
//       if ((booleanCheck && (data[key] === '1' || data[key] === 1)) || (!booleanCheck && data[key] && data[key] !== 'NULL')) {
//         values.push(booleanCheck ? i : data[key]);
//       }
//     }
//     return values;
//   }

//   private extractQuestionnaire(data: DataObject, allColumns: string[], row: string[]): Record<string, any[]> {
//     let questionnaire: Record<string, any[]> = {};
//     const excludedFields = new Set([
//         "EpiID", "patient", "MRN", "chart_status", "PayorSourceName", "BranchCode",
//         "form", "form_status", "form_date", "user", "date_modified", "blink"
//     ]);

//     allColumns.forEach((header, index) => {
//         const cleanedHeader = header.replace(/\(\d+\)/g, ""); 
//         const value = row[index];

//         if (excludedFields.has(cleanedHeader)) {
//             return;
//         }

//         if (value !== null && value !== "" && value !== 'NULL' && !(typeof value === 'string' && value.trim() === "") && value !== undefined) {
//             if (!questionnaire[cleanedHeader]) {
//                 questionnaire[cleanedHeader] = []; 
//             }
//             questionnaire[cleanedHeader].push(value); 
//         }
//     });

//     return questionnaire;
//   }

//   private sanitizeInput(input: any): string {
//     if (typeof input !== 'string') {
//       return ''; 
//     }

//     return input.replace(/<[^>]*>?/gm, '').trim(); 
//   }

//   private handleNullOrEmpty(value: string): string {
//     return value === '' || value === 'NULL' ? undefined : value;
//   }

//   private splitFullName(fullName: string): [string, string] {
//     const [firstName = '', lastName = ''] = fullName.split(', ').map(name => name.trim());
//     return [firstName, lastName];
//   }

//   private extractIcdCodes(data: DataObject): string[] {
//     return this.extractValues(data, 1, 15, 'M1023', false) as string[];
//   }

//   private isRowEmpty(row: string[]): boolean {
//     return row.every(cell => !cell || (typeof cell === 'string' && cell.trim() === ''));
//   }
// }
import * as XLSX from 'xlsx';
import { Injectable } from '@nestjs/common';
import { FileProcessor } from '../../interfaces/File-processor';
import { ProcessedData } from '../../interfaces/Processed-data';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileData, ExcelFileDataDocument } from '../../schema/Excel-file-data';
import { PatientVisitService } from '../Patient-visit-service';

import { InvalidHeaderException, ExcelFileProcessingException } from 'src/exceptions/excel-file-processing.exception';
import { extractQuestionnaire, extractValues, formatDate, handleNullOrEmpty, isRowEmpty, mapRowToDataObject, sanitizeInput, splitFullName, validateProcessedData } from '../utils/utilities';

@Injectable()
export class ExcelFileProcessor implements FileProcessor {
  constructor(
    @InjectModel(ExcelFileData.name) private readonly excelFileDataModel: Model<ExcelFileDataDocument>,
    private readonly patientVisitService: PatientVisitService,
  ) {}

  async processingFile(buffer: Buffer): Promise<ProcessedData[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    const worksheetStream = XLSX.stream.to_json(workbook.Sheets[sheetName], { header: 1 });

    let headers: string[] = [];
    const processedData: ProcessedData[] = [];

    let rowIndex = 0;
    for await (const row of worksheetStream) {
      if (rowIndex === 0) {
        headers = row;
        this.validateHeaders(headers);
      } else {
        if (!isRowEmpty(row)) {
          const data = this.transformRowToProcessedData(row, headers);
          await this.patientVisitService.updatePatientAndVisit(data);
          await this.storeDataInSchema(data);
          processedData.push(data);
        }
      }
      rowIndex++;
    }

    return processedData;
  }

  private validateHeaders(headers: string[]): void {
    const requiredHeaders = ['MRN', 'BranchCode', 'form', 'admitDate'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
      throw new InvalidHeaderException(missingHeaders);
    }
  }

  private transformRowToProcessedData(row: string[], headers: string[]): ProcessedData {
    const data = mapRowToDataObject(row, headers);

    const fullName = sanitizeInput(data['patient'] as string || '');
    const [firstName, lastName] = splitFullName(fullName);

    let visitDate = formatDate(sanitizeInput(data['admitDate'] as string || ''));
    if (!visitDate) {
      visitDate = new Date().toISOString().split('T')[0]; 
    }

    const processedData: ProcessedData = {
      fullName,
      firstName,
      lastName,
      mrn: sanitizeInput(data['MRN'] as string || ''),
      charStatus: sanitizeInput(data['chart_status'] as string || ''),
      payerSourceName: sanitizeInput(data['PayorSourceName'] as string || ''),
      branchCode: sanitizeInput(data['BranchCode'] as string || ''),
      visitType: sanitizeInput(data['form'] as string || ''),
      status: sanitizeInput(data['form_status'] as string || ''),
      visitDate,
      ZipCode: sanitizeInput(data['blink'] as string || '00000'),
      HCHB_calculation: handleNullOrEmpty(sanitizeInput(data['VisitCntAll'] as string || undefined)),
      total_pmt: handleNullOrEmpty(sanitizeInput(data['Timing'] as string || undefined)),
      icdCodes: extractValues(data, 1, 15, 'M1023', false) as string[],
      questionnaire: extractQuestionnaire(data, headers, row),
    };

    validateProcessedData(processedData);
    return processedData;
  }

  private async storeDataInSchema(data: ProcessedData): Promise<void> {
    try {
      const newExcelFileData = new this.excelFileDataModel(data);
      await newExcelFileData.save();
    } catch (error) {
      throw new ExcelFileProcessingException(`Failed to save data: ${error.message}`);
    }
  }
}
