
 import { Injectable, Logger } from '@nestjs/common';
 import { InjectModel } from '@nestjs/mongoose';
 import { Model } from 'mongoose';
 import { Patient, PatientDocument } from '../schema/patient-schema';
 import { Visit, VisitDocument } from '../schema/visit-schema';
import { MergedPatientVisitRecord } from '../interfaces/Processed-data';
 
 @Injectable()
 export class PatientVisitMergedService {
   private readonly logger = new Logger(PatientVisitMergedService.name);
 
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
   * @returns {Promise<MergedPatientVisitRecord[]>} An array of merged patient and visit records.
   */
   async getMergedPatientVisitRecords(): Promise<MergedPatientVisitRecord[]> {
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
 }
 