export interface ProcessedData {
  fullName: string;
  firstName: string;
  lastName: string;
  mrn: string;
  charStatus: string;
  payerSourceName: string;
  branchCode: string;
  visitType: string;
  status: string;
  visitDate: string;
  ZipCode: string;
  HCHB_calculation: string;
  total_pmt: string;
  icdCodes: string[];
  questionnaire: { [key: string]: number[] };
}
export interface DataObject {
  [key: string]: string | number;
}