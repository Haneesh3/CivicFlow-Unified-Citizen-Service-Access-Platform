import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, ComplaintsModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
