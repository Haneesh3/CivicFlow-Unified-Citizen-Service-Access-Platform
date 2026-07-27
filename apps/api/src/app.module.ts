import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ServicesModule } from './services/services.module';
import { BookingModule } from './booking/booking.module';
import { MongoModule } from './mongo/mongo.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, ComplaintsModule, ServicesModule, BookingModule, MongoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
