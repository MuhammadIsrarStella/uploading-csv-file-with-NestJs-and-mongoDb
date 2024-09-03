import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NoVisitDocument } from '../schema/no-visit-schema';

@Injectable()
export class NoVisitService {
  private readonly logger = new Logger(NoVisitService.name);

  constructor(
    @InjectModel('NoVisit') private noVisitModel: Model<NoVisitDocument>,
  ) {}

  async findNoVisitRecords(): Promise<NoVisitDocument[]> {
    const records = await this.noVisitModel.aggregate([
      {
        $lookup: {
          from: 'visits', 
          localField: 'mrn', 
          foreignField: 'mrn', 
          as: 'visitRecords',
        },
      },
      {
        $match: {
          'visitRecords': { $size: 0 }, 
        },
      },
      {
        $project: {
          visitRecords: 0, 
        },
      },
    ]);

    this.logger.log('Aggregation result:', records);

    return records;
  }
}
