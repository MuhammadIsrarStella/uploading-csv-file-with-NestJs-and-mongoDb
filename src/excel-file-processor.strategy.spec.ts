import { ExcelFileProcessor } from './services/strategies/excel-file-processor.strategy';
import { Model } from 'mongoose';
import { ExcelFileDataDocument } from './schema/Excel-file-data';
import { PatientVisitService } from './services/Patient-visit-service';
import * as XLSX from 'xlsx';

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
      upsertPatientAndVisit: jest.fn(),
    } as unknown as PatientVisitService;

    processor = new ExcelFileProcessor(excelFileDataModel, patientVisitService);
  });

  describe('splitFullName', () => {
    it('should split full name into first and last name', () => {
      const [firstName, lastName] = processor['splitFullName']('Muhammad, Israr');
      expect(firstName).toBe('Muhammad');
      expect(lastName).toBe('Israr');
    });

    it('should handle empty full name', () => {
      const [firstName, lastName] = processor['splitFullName']('');
      expect(firstName).toBe('');
      expect(lastName).toBe('');
    });
  });

  describe('extractIcdCodes', () => {
    it('should extract ICD codes correctly', () => {
      const data = { 'M1023(1)': 'Code1', 'M1023(2)': 'Code2', 'M1023(3)': 'NULL' };
      const icdCodes = processor['extractIcdCodes'](data);
      expect(icdCodes).toEqual(['Code1', 'Code2']);
    });
  });

  describe('extractValues', () => {
    it('should extract values correctly without boolean check', () => {
      const data = { 'M1023(1)': 'Code1', 'M1023(2)': 'Code2', 'M1023(3)': 'NULL' };
      const values = processor['extractValues'](data, 1, 3, 'M1023', false);
      expect(values).toEqual(['Code1', 'Code2']);
    });

    it('should extract values correctly with boolean check', () => {
      const data = { 'M1033(1)': '1', 'M1033(2)': '0', 'M1033(3)': '1' };
      const values = processor['extractValues'](data, 1, 3, 'M1033', true);
      expect(values).toEqual([1, 3]);
    });
  });

  describe('sanitizeInput', () => {
    it('should return empty string for non-string input', () => {
      expect(processor['sanitizeInput'](null)).toBe('');
      expect(processor['sanitizeInput'](undefined)).toBe('');
    });

    it('should sanitize and trim string input', () => {
      expect(processor['sanitizeInput']('<script>alert("test")</script>  test')).toBe('alert("test") test');
      expect(processor['sanitizeInput']('  some text  ')).toBe('some text');
    });
  });

  describe('handleNullOrEmpty', () => {
    it('should return undefined for empty string or "NULL"', () => {
      expect(processor['handleNullOrEmpty']('')).toBeUndefined();
      expect(processor['handleNullOrEmpty']('NULL')).toBeUndefined();
    });

    it('should return the original value if not empty or "NULL"', () => {
      expect(processor['handleNullOrEmpty']('some value')).toBe('some value');
      expect(processor['handleNullOrEmpty']('0')).toBe('0');
    });
  });

  describe('transformRowToProcessedData', () => {
    it('should transform row data to ProcessedData object', async () => {
      const row = ['SP First, SP Last', 'SD00004386002', 'PT00', '2024-08-20', 'GSD', 'SHARP COMMUNITY MEDICAL GROUP MA PER VISIT'];
      const headers = ['patient', 'MRN', 'form', 'admitDate', 'BranchCode', 'PayorSourceName'];

      const result = await processor['transformRowToProcessedData'](row, headers);

      expect(result).toEqual({
        fullName: 'SP First, SP Last',
        firstName: 'SP First',
        lastName: 'SP Last',
        mrn: 'SD00004386002',
        charStatus: '',
        payerSourceName: 'SHARP COMMUNITY MEDICAL GROUP MA PER VISIT',
        branchCode: 'GSD',
        visitType: 'PT00',
        status: '',
        visitDate: '2024-08-20',
        ZipCode: '00000',
        HCHB_calculation: '',
        total_pmt: '',
        icdCodes: [],
        questionnaire: {},
      });
    });
  });

  describe('isRowEmpty', () => {
    it('should return true if all cells are empty or null', () => {
      expect(processor['isRowEmpty'](['', null, undefined])).toBe(true);
    });

    it('should return false if any cell is not empty', () => {
      expect(processor['isRowEmpty'](['', 'some value', null])).toBe(false);
    });
  });

  describe('processingFile', () => {
    it('should process file and upsert data', async () => {
      const buffer = Buffer.from(''); 
      const mockJsonData = [
        ['patient', 'MRN', 'form', 'admitDate', 'BranchCode', 'PayorSourceName'],
        ['SP First, SP Last', 'SD00004386002', 'PT00', '2024-08-20', 'GSD', 'SHARP COMMUNITY MEDICAL GROUP MA PER VISIT'],
      ];

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

      const transformRowToProcessedDataSpy = jest.spyOn<any, any>(processor, 'transformRowToProcessedData').mockResolvedValue({
        fullName: 'SP First, SP Last',
        firstName: 'SP First',
        lastName: 'SP Last',
        mrn: 'SD00004386002',
        charStatus: '',
        payerSourceName: 'SHARP COMMUNITY MEDICAL GROUP MA PER VISIT',
        branchCode: 'GSD',
        visitType: 'PT00',
        status: '',
        visitDate: '2024-08-20',
        ZipCode: '00000',
        HCHB_calculation: '',
        total_pmt: '',
        icdCodes: [],
        questionnaire: {},
      });

      const result = await processor.processingFile(buffer);

      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
      expect(transformRowToProcessedDataSpy).toHaveBeenCalled();
      expect(patientVisitService.updatePatientAndVisit).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
