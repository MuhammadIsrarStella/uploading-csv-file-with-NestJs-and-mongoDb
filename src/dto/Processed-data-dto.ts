import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class ProcessedDataDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  mrn: string;

  @IsNotEmpty()
  @IsString()
  charStatus: string;

  @IsNotEmpty()
  @IsString()
  payerSourceName: string;

  @IsNotEmpty()
  @IsString()
  branchCode: string;

  @IsNotEmpty()
  @IsString()
  visitType: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  visitDate: string;

  @IsNotEmpty()
  @IsString()
  ZipCode: string;

  @IsOptional()
  @IsString()
  HCHB_calculation?: string;

  @IsOptional()
  @IsString()
  total_pmt?: string;

  @IsArray()
  @IsString({ each: true })
  icdCodes: string[];

  @IsOptional()
  questionnaire: { [key: string]: number[] };
}
