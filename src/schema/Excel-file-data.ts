import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExcelFileDataDocument = ExcelFileData & Document;

@Schema()
export class ExcelFileData {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  mrn: string;

  @Prop({ required: true })
  charStatus: string;

  @Prop({ required: true })
  payerSourceName: string;

  @Prop({ required: true })
  branchCode: string;

  @Prop({ required: true })
  visitType: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  visitDate: string;

  @Prop({ required: true })
  ZipCode: string;

  @Prop({ required: false })
  HCHB_calculation: string;

  @Prop({ required: false })
  total_pmt: string;

  @Prop({ type: [String] })
  icdCodes: string[];

  @Prop({ type: Map, of: [MongooseSchema.Types.Mixed] })
  questionnaire: Record<string, (number | string)[]>;

}

export const ExcelFileDataSchema = SchemaFactory.createForClass(ExcelFileData);
