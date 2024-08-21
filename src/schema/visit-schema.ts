import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type VisitDocument = Visit & Document;

@Schema()
export class Visit {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  mrn: string;

  @Prop({ required: true })
  visitType: string;

  @Prop({ required: true })
  visitDate: string;

  @Prop()
  status: string;

  @Prop()
  payerSourceName: string;

  @Prop()
  branchCode: string;

  @Prop({ type: Map, of: [MongooseSchema.Types.Mixed] })
  questionnaire: Record<string, any>;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
