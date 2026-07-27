import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'cf-app';

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.logger.log(`MongoDB connected to database: ${dbName}`);
    } catch (error) {
      this.logger.warn(`MongoDB unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB is not connected');
    }
    return this.db;
  }

  async close() {
    await this.client?.close();
  }
}
