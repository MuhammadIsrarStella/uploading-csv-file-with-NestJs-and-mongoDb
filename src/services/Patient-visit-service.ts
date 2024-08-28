import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from '../schema/patient-schema';
import { Visit, VisitDocument } from '../schema/visit-schema';
import { ProcessedData } from 'src/interfaces/Processed-data';

@Injectable()
export class PatientVisitService {
  private readonly logger = new Logger(PatientVisitService.name);

  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>
  ) {}

  /**
   * Retrieves merged records from the `patients` and `visits` collections.
   * This method performs a left outer join between the two collections and filters out records
   * with null or empty values for specific fields. The resulting documents include selected fields
   * from both the patient and visit records, combined into a single document.
   * 
   * @returns {Promise<any[]>} An array of merged patient and visit records.
   */
  async gettingMergedPatientVisitRecords(): Promise<any[]> {
    const aggregation = await this.patientModel.aggregate([
      {
        $lookup: {
          from: 'visits',
          localField: '_id',
          foreignField: 'patientId',
          as: 'visitRecords'
        }
      },
      {
        $unwind: {
          path: '$visitRecords',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $and: [
            { 'visitRecords.mrn': { $nin: [null, ''] } },
            { 'visitRecords.visitDate': { $nin: [null, ''] } }
          ]
        }
      },
      {
        $project: {
          _id: 0,
          patientId: '$_id',
          mrn: '$mrn',
          firstName: '$firstName',
          lastName: '$lastName',
          visitType: '$visitRecords.visitType',
          visitDate: '$visitRecords.visitDate',
          status: '$visitRecords.status',
          payerSourceName: '$visitRecords.payerSourceName',
          branchCode: '$visitRecords.branchCode',
          questionnaire: '$visitRecords.questionnaire'
        }
      }
    ]);

    return aggregation;
  }

  /**
   * Updates or creates patient and visit records in the database based on the provided data.
   * If a patient record with the given MRN exists, it is updated; otherwise, a new record is created.
   * Similarly, if a visit record with the same MRN, visit type, and visit date exists, it is updated;
   * otherwise, a new visit record is created. The method logs each operation performed.
   * 
   * @param {ProcessedData} data - The data containing patient and visit details to be processed.
   * @returns {Promise<void>}
   */
  async updatePatientAndVisit(data: ProcessedData): Promise<void> {
    const { mrn, firstName, lastName, visitType, visitDate } = data;
    let patient = await this.patientModel.findOne({ mrn });
    const patientOperation = patient ? 'updated' : 'created';

    if (!patient) {
      patient = await this.patientModel.create({ mrn, firstName, lastName });
    } else {
      await this.patientModel.updateOne({ mrn }, { $set: { firstName, lastName } });
    }

    const patientId = patient._id;
    this.logger.log(`Patient record for MRN: ${mrn} ${patientOperation} with ID: ${patientId}`);

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
      await this.visitModel.updateOne(
        { mrn, visitType, visitDate },
        {
          $set: {
            branchCode: data.branchCode,
            status: data.status,
            payerSourceName: data.payerSourceName,
          },
          $addToSet: {
            icdCodes: { $each: data.icdCodes },
            ...Object.entries(data.questionnaire).reduce((acc, [key, value]) => {
              acc[`questionnaire.${key}`] = { $each: value };
              return acc;
            }, {})
          }
        }
      );
    }

    this.logger.log(`Visit for MRN: ${mrn} ${visitOperation} with ID: ${visit._id}`);
  }
}
