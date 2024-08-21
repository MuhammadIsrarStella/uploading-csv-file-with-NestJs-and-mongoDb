
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProcessedData } from 'src/interfaces/Processed-data';
import { Patient, PatientDocument } from '../schema/patient-schema';
import { Visit, VisitDocument } from '../schema/visit-schema';

@Injectable()
export class PatientVisitService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>
  ) {}

  async upsertPatientAndVisit(data: ProcessedData): Promise<void> {
    const { mrn, firstName, lastName, visitType, visitDate } = data;

    console.log('Upserting patient:', { mrn, firstName, lastName });
    const patient = await this.patientModel.findOneAndUpdate(
      { mrn },
      { firstName, lastName },
      { new: true, upsert: true }
    );

    console.log('Patient upserted:', patient);

    console.log('Upserting visit:', { mrn, visitType, visitDate });
    const visit = await this.visitModel.findOneAndUpdate(
      { mrn, visitType, visitDate },
      { patientId: patient._id, ...data },
      { new: true, upsert: true }
    );

    console.log('Visit upserted:', visit);
  }
}
