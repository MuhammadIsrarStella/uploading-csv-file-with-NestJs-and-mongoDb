
import * as XLSX from 'xlsx';
import { Injectable } from '@nestjs/common';
import { FileProcessor } from '../../interfaces/File-processor';
import { ProcessedData } from '../../interfaces/Processed-data';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileData, ExcelFileDataDocument } from '../../schema/Excel-file-data';
import { PatientVisitService } from '../Patient-visit-service';

import { InvalidHeaderException, ExcelFileProcessingException } from '../../exceptions/excel-file-processing.exception';
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
