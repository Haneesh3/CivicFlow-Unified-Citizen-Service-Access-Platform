import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';

@Injectable()
export class ComplaintActivityService {
  constructor(private readonly mongoService: MongoService) {}

  async logActivity(complaintId: string, action: string, details?: Record<string, any>) {
    try {
      const collection = this.mongoService.getDb().collection('complaint_activity');
      await collection.insertOne({
        complaintId,
        action,
        details: details || {},
        createdAt: new Date(),
      });
    } catch (error) {
      // Intentionally swallow errors so PostgreSQL flow remains unaffected
    }
  }
}
