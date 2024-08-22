import { DataObject } from '../../interfaces/Processed-data';
import { ExcelFileProcessingException } from '../../exceptions/excel-file-processing.exception';
import { ProcessedDataDto } from '../../dto/Processed-data-dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProcessedData } from '../../interfaces/Processed-data';
import { VisitDocument } from '../../schema/visit-schema';

export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') {
    return ''; 
  }
  return input.replace(/<[^>]*>?/gm, '').trim(); 
}

export function handleNullOrEmpty(value: string): string | undefined {
  return value === '' || value === 'NULL' ? undefined : value;
}

export function splitFullName(fullName: string): [string, string] {
  const [firstName = '', lastName = ''] = fullName.split(', ').map(name => name.trim());
  return [firstName, lastName];
}

export function extractIcdCodes(data: DataObject): string[] {
  return extractValues(data, 1, 15, 'M1023', false) as string[];
}

export function isRowEmpty(row: string[]): boolean {
  return row.every(cell => !cell || (typeof cell === 'string' && cell.trim() === ''));
}

export function mapRowToDataObject(row: string[], headers: string[]): DataObject {
  return headers.reduce((acc: DataObject, header: string, index: number) => {
    acc[header] = handleNullOrEmpty(sanitizeInput(row[index] || ''));
    return acc;
  }, {} as DataObject);
}

export function formatDate(date: string): string {
  if (!date) {
    return '';  
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    throw new ExcelFileProcessingException(`Invalid date format: ${date}`);
  }

  return parsedDate.toISOString().split('T')[0];
}

export async function validateProcessedData(data: any): Promise<void> {
  const dto = plainToInstance(ProcessedDataDto, data);
  const errors = await validate(dto);
  if (errors.length > 0) {
    throw new ExcelFileProcessingException(`Validation failed: ${errors.toString()}`);
  }
}

export function extractValues(
  data: DataObject,
  start: number,
  end: number,
  prefix: string,
  booleanCheck: boolean
): (string | number)[] {
  const values: (string | number)[] = [];
  for (let i = start; i <= end; i++) {
    const key = `${prefix}(${i})`;
    if (
      (booleanCheck && (data[key] === '1' || data[key] === 1)) ||
      (!booleanCheck && data[key] && data[key] !== 'NULL')
    ) {
      values.push(booleanCheck ? i : data[key]);
    }
  }
  return values;
}

export function extractQuestionnaire(
  data: DataObject,
  allColumns: string[],
  row: string[]
): Record<string, any[]> {
  let questionnaire: Record<string, any[]> = {};
  const excludedFields = new Set([
    "EpiID", "patient", "MRN", "chart_status", "PayorSourceName", "BranchCode",
    "form", "form_status", "form_date", "user", "date_modified", "blink"
  ]);

  allColumns.forEach((header, index) => {
    const cleanedHeader = header.replace(/\(\d+\)/g, ""); 
    const value = row[index];

    if (excludedFields.has(cleanedHeader)) {
      return;
    }

    if (
      value !== null && value !== "" && value !== 'NULL' &&
      !(typeof value === 'string' && value.trim() === "") &&
      value !== undefined
    ) {
      if (!questionnaire[cleanedHeader]) {
        questionnaire[cleanedHeader] = []; 
      }
      questionnaire[cleanedHeader].push(value); 
    }
  });

  return questionnaire;
}

export function logPatientOperation(logger: Logger, mrn: string, id: Types.ObjectId, operation: string) {
  logger.log(`Patient record for MRN: ${mrn} ${operation} with ID: ${id}`);
}

export function logVisitOperation(logger: Logger, mrn: string, id: Types.ObjectId, operation: string) {
  logger.log(`Visit for MRN: ${mrn} ${operation} with ID: ${id}`);
}

export function prepareUpdateFields(data: ProcessedData): Partial<VisitDocument> {
  return {
    branchCode: data.branchCode,
    status: data.status,
    payerSourceName: data.payerSourceName,
  };
}

export function prepareAddToSetUpdate(data: ProcessedData): Record<string, any> {
  const addToSetUpdate: Record<string, any> = {
    icdCodes: { $each: data.icdCodes },
  };

  for (const key in data.questionnaire) {
    addToSetUpdate[`questionnaire.${key}`] = { $each: data.questionnaire[key] };
  }

  return addToSetUpdate;
}
