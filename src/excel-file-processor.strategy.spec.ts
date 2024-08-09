import { ExcelFileProcessor } from './services/strategies/excel-file-processor.strategy';
import { Model } from 'mongoose';
import { ExcelFileDataDocument } from './schema/excel-file.schema';

jest.mock('xlsx');

describe('ExcelFileProcessor', () => {
  let processor: ExcelFileProcessor;
  let excelFileDataModel: Model<ExcelFileDataDocument>;

  beforeEach(() => {
    excelFileDataModel = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      create: jest.fn(),
    } as unknown as Model<ExcelFileDataDocument>;

    processor = new ExcelFileProcessor(excelFileDataModel);
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
});
