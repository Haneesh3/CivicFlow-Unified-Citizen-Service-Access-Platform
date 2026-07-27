import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MongoModule } from '../mongo/mongo.module';
import { ComplaintActivityService } from './complaint-activity.service';

@Module({
  imports: [PrismaModule, AuthModule, MongoModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintActivityService],
  exports: [ComplaintsService]
})
export class ComplaintsModule {}
