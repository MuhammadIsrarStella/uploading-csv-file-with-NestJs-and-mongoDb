import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema()
export class Patient {
  @Prop({ required: true })
  mrn: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
