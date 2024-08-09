import * as XLSX from 'xlsx';
import { FileProcessor } from '../../interfaces/file-processor.interface';
import { DataObject, ProcessedData } from '../../interfaces/processed-data.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileData, ExcelFileDataDocument } from '../../schema/excel-file.schema';
import * as sanitizeHtml from 'sanitize-html';
export class ExcelFileProcessor implements FileProcessor {
  constructor(
    @InjectModel(ExcelFileData.name) private readonly excelFileDataModel: Model<ExcelFileDataDocument>
  ) {}

  async processingFile(buffer: Buffer): Promise<ProcessedData[]> {
    try {
      const jsonData = this.readExcelFile(buffer);
      const headers = jsonData[0];

      this.validateHeaders(headers);
      this.validateData(jsonData);

      const processedData = jsonData.slice(1).filter(row => row.length > 0).map(row => this.transformRowToProcessedData(row, headers));

      for (const data of processedData) {
        await this.upsertData(data);
      }

      return processedData;
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to process Excel file');
    }
  }

  private readExcelFile(buffer: Buffer): string[][] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  }

  private validateHeaders(headers: string[]): void {
    const requiredHeaders = ['MRN', 'BranchCode', 'form', 'admitDate'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  private validateData(data: string[][]): void {
    for (const row of data.slice(1)) {
      row.forEach((cell, index) => {
        if (typeof cell === 'string' && (cell.includes('<script>') || cell.includes('--'))) {
          throw new Error(`Invalid data found in column ${index + 1}: ${cell}`);
        }
      });
    }
  }

  private sanitizeInput(input: string): string {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  private transformRowToProcessedData(row: string[], headers: string[]): ProcessedData {
    const data = this.mapRowToDataObject(row, headers);

    const fullName = this.sanitizeInput(data['patient'] as string || '');
    const [firstName, lastName] = this.splitFullName(fullName);

    return {
      fullName,
      firstName,
      lastName,
      mrn: this.sanitizeInput(data['MRN'] as string || ''),
      charStatus: this.sanitizeInput(data['chart_status'] as string || ''),
      payerSourceName: this.sanitizeInput(data['PayorSourceName'] as string || ''),
      branchCode: this.sanitizeInput(data['BranchCode'] as string || ''),
      visitType: this.sanitizeInput(data['form'] as string || ''),
      status: this.sanitizeInput(data['form_status'] as string || ''),
      visitDate: this.sanitizeInput(data['form_date'] as string || ''),
      ZipCode: this.sanitizeInput(data['blink'] as string || '00000'),  
      HCHB_calculation: this.sanitizeInput(data['VisitCntAll'] as string || ''),
      total_pmt: this.sanitizeInput(data['Timing'] as string || ''),
      icdCodes: this.extractIcdCodes(data),
      questionnaire: this.extractQuestionnaire(data),
    };
  }

  private mapRowToDataObject(row: string[], headers: string[]): DataObject {
    return headers.reduce((acc: DataObject, header: string, index: number) => {
      acc[header] = this.sanitizeInput(row[index] || '');
      return acc;
    }, {} as DataObject);
  }

  private splitFullName(fullName: string): [string, string] {
    const [firstName = '', lastName = ''] = fullName.split(', ').map(name => name.trim());
    return [firstName, lastName];
  }

  private extractIcdCodes(data: DataObject): string[] {
    return this.extractValues(data, 1, 15, 'M1023', false) as string[];
  }

  private extractQuestionnaire(data: DataObject): { [key: string]: number[] } {
    const questionnaire: { [key: string]: number[] } = {};
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    for (const key of Object.keys(data)) {
      if (alphanumericRegex.test(key) && (data[key] === '1' || data[key] === 1)) {
        if (!questionnaire[key]) {
          questionnaire[key] = [];
        }
        questionnaire[key].push(parseInt(data[key] as string, 10));
      }
    }
    return questionnaire;
  }

  private extractValues(
    data: DataObject,
    start: number,
    end: number,
    prefix: string,
    booleanCheck: boolean
  ): (string | number)[] {
    const values: (string | number)[] = [];
    for (let i = start; i <= end; i++) {
      const key = `${prefix}(${i})`;
      if ((booleanCheck && (data[key] === '1' || data[key] === 1)) || (!booleanCheck && data[key] && data[key] !== 'NULL')) {
        values.push(booleanCheck ? i : data[key]);
      }
    }
    return values;
  }

  private async upsertData(data: ProcessedData): Promise<void> {
    const { mrn, visitType, visitDate } = data;

    const existingData = await this.excelFileDataModel.findOne({ mrn, visitType, visitDate }).exec();
    
    if (existingData) {
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          data[key] = [...new Set([...existingData[key], ...data[key]])];
        } else {
          data[key] = data[key] || existingData[key];
        }
      }
      await this.excelFileDataModel.updateOne({ mrn, visitType, visitDate }, data).exec();
    } else {
      await this.excelFileDataModel.create(data);
    }
  }
}