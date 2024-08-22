import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProcessedData } from '../interfaces/Processed-data';
import { Patient, PatientDocument } from '../schema/patient-schema';
import { Visit, VisitDocument } from '../schema/visit-schema';
import { logPatientOperation, logVisitOperation, prepareAddToSetUpdate, prepareUpdateFields } from './utils/utilities';

@Injectable()
export class PatientVisitService {
  private readonly logger = new Logger(PatientVisitService.name);

  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>
  ) {}

  async updatePatientAndVisit(data: ProcessedData): Promise<void> {
    const { mrn, firstName, lastName, visitType, visitDate } = data;
    let patient = await this.patientModel.findOne({ mrn });
    const patientOperation = patient ? 'updated' : 'created';

    if (!patient) {
      patient = await this.patientModel.create({ mrn, firstName, lastName });
    } else {
      await this.patientModel.updateOne({ mrn }, { $set: { firstName, lastName } });
    }

    const patientId = patient._id as Types.ObjectId;
    logPatientOperation(this.logger, mrn, patientId, patientOperation);
    let visit = await this.visitModel.findOne({ mrn, visitType, visitDate });
    const visitOperation = visit ? 'updated' : 'created';

    if (!visit) {
      visit = await this.visitModel.create({
        patientId,
        mrn,
        visitType,
        visitDate,
        branchCode: data.branchCode,
        status: data.status,
        payerSourceName: data.payerSourceName,
        icdCodes: data.icdCodes,
        questionnaire: data.questionnaire,
      });
    } else {
      const updateFields = prepareUpdateFields(data);
      await this.visitModel.updateOne(
        { mrn, visitType, visitDate },
        { $set: updateFields }
      );
      const addToSetUpdate = prepareAddToSetUpdate(data);
      await this.visitModel.updateOne(
        { mrn, visitType, visitDate },
        { $addToSet: addToSetUpdate }
      );
    }

    const visitId = visit._id as Types.ObjectId;
    logVisitOperation(this.logger, mrn, visitId, visitOperation);
  }
}
