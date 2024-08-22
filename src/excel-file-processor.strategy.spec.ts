import { ExcelFileProcessor } from './services/strategies/excel-file-processor.strategy';
import { Model } from 'mongoose';
import { ExcelFileDataDocument } from './schema/Excel-file-data';
import { PatientVisitService } from './services/Patient-visit-service';
import { sanitizeInput, handleNullOrEmpty, splitFullName, extractIcdCodes, isRowEmpty, mapRowToDataObject, formatDate, validateProcessedData, extractQuestionnaire } from './services/utils/utilities';
import { ExcelFileProcessingException } from './exceptions/excel-file-processing.exception';
        
        jest.mock('xlsx');
        
        describe('ExcelFileProcessor', () => {
          let processor: ExcelFileProcessor;
          let excelFileDataModel: Model<ExcelFileDataDocument>;
          let patientVisitService: PatientVisitService;
        
          beforeEach(() => {
            excelFileDataModel = {
              findOne: jest.fn(),
              updateOne: jest.fn(),
              create: jest.fn(),
            } as unknown as Model<ExcelFileDataDocument>;
        
            patientVisitService = {
              updatePatientAndVisit: jest.fn(),
            } as unknown as PatientVisitService;
        
            processor = new ExcelFileProcessor(excelFileDataModel, patientVisitService);
          });
        
          describe('sanitizeInput', () => {
            it('should return empty string for non-string input', () => {
              expect(sanitizeInput(null)).toBe('');
              expect(sanitizeInput(undefined)).toBe('');
            });
          });
        
          describe('handleNullOrEmpty', () => {
            it('should return undefined for empty string or "NULL"', () => {
              expect(handleNullOrEmpty('')).toBeUndefined();
              expect(handleNullOrEmpty('NULL')).toBeUndefined();
            });
        
            it('should return the original value if not empty or "NULL"', () => {
              expect(handleNullOrEmpty('some value')).toBe('some value');
              expect(handleNullOrEmpty('0')).toBe('0');
            });
          });
        
          describe('splitFullName', () => {
            it('should split full name into first and last name', () => {
              const [firstName, lastName] = splitFullName('Muhammad, Israr');
              expect(firstName).toBe('Muhammad');
              expect(lastName).toBe('Israr');
            });
        
            it('should handle empty full name', () => {
              const [firstName, lastName] = splitFullName('');
              expect(firstName).toBe('');
              expect(lastName).toBe('');
            });
          });
        
          describe('extractIcdCodes', () => {
            it('should extract ICD codes correctly', () => {
              const data = { 'M1023(1)': 'Code1', 'M1023(2)': 'Code2', 'M1023(3)': 'NULL' };
              const icdCodes = extractIcdCodes(data);
              expect(icdCodes).toEqual(['Code1', 'Code2']);
            });
        
            it('should return an empty array if no valid codes are present', () => {
              const data = { 'M1023(1)': 'NULL', 'M1023(2)': 'NULL' };
              const icdCodes = extractIcdCodes(data);
              expect(icdCodes).toEqual([]);
            });
          });
        
          describe('isRowEmpty', () => {
            it('should return true if all cells are empty or null', () => {
              expect(isRowEmpty(['', null, undefined])).toBe(true);
            });
        
            it('should return false if any cell is not empty', () => {
              expect(isRowEmpty(['', 'some value', null])).toBe(false);
            });
          });
        
          describe('mapRowToDataObject', () => {
            it('should map row to data object correctly', () => {
              const row = ['value1', 'value2'];
              const headers = ['header1', 'header2'];
              const result = mapRowToDataObject(row, headers);
              expect(result).toEqual({ header1: 'value1', header2: 'value2' });
            });
        
          });
        
          describe('formatDate', () => {
            it('should format date correctly', () => {
              const date = '2024-08-20';
              const result = formatDate(date);
              expect(result).toBe('2024-08-20');
            });
        
            it('should throw an exception for an invalid date', () => {
              expect(() => formatDate('invalid-date')).toThrowError(ExcelFileProcessingException);
            });
          });
        
          describe('validateProcessedData', () => {
            it('should throw an exception if validation fails', async () => {
              const data = { firstName: '', lastName: '', mrn: '', visitType: '', visitDate: '' };
              await expect(validateProcessedData(data)).rejects.toThrowError(ExcelFileProcessingException);
            });
          });
        
          describe('extractQuestionnaire', () => {
            it('should extract questionnaire data correctly', () => {
              const data = { question1: 'Answer1', question2: 'Answer2', 'question3(1)': 'Answer3' };
              const allColumns = ['question1', 'question2', 'question3(1)'];
              const row = ['Answer1', 'Answer2', 'Answer3'];
              const result = extractQuestionnaire(data, allColumns, row);
              expect(result).toEqual({ question1: ['Answer1'], question2: ['Answer2'], question3: ['Answer3'] });
            });
        
            it('should exclude fields that are not part of the questionnaire', () => {
              const data = { question1: 'Answer1', MRN: '12345' };
              const allColumns = ['question1', 'MRN'];
              const row = ['Answer1', '12345'];
              const result = extractQuestionnaire(data, allColumns, row);
              expect(result).toEqual({ question1: ['Answer1'] });
            });
          });
        
        
        });
 