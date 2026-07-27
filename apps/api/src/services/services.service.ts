import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { category: 'asc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id }
    });
  }

  async createApplication(userId: string, payload: any) {
    const { appointmentDate, appointmentSlot, data, ...rest } = payload;
    const { serviceTitle, subService } = data;
    
    // Generate a unique reference ID (e.g., CF-A1B2C3)
    const referenceId = `CF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const application = await this.prisma.serviceApplication.create({
      data: {
        ...rest,
        data,
        referenceId,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        appointmentSlot,
        userId,
      },
    });

    // Create initial timeline status
    try {
      await this.prisma.serviceApplicationUpdate.create({
        data: {
          applicationId: application.id,
          status: 'SUBMITTED',
          message: `Application submitted successfully. Appointment scheduled for ${appointmentDate ? new Date(appointmentDate).toLocaleDateString() : 'N/A'} at ${appointmentSlot || 'N/A'}.`,
        }
      });
    } catch (e) {
      console.error('Initial status update failed:', e);
    }

    // Create App Notification
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Appointment Booked',
          body: `You have booked ${subService} for ${serviceTitle} on ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentSlot}. Ref: ${referenceId}`,
        }
      });
    } catch (e) {
      console.error('Notification failed but booking succeeded:', e);
    }

    return application;
  }

  async findUserApplications(userId: string) {
    return this.prisma.serviceApplication.findMany({
      where: { userId },
      include: { 
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllApplications() {
    return this.prisma.serviceApplication.findMany({
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateApplicationStatus(id: string, status: string, comment?: string) {
    const updatedStatus = status as ApplicationStatus;
    const updated = await this.prisma.serviceApplication.update({
      where: { id },
      data: { status: updatedStatus }
    });

    await this.prisma.serviceApplicationUpdate.create({
      data: {
        applicationId: id,
        status: updatedStatus,
        message: comment || `Status updated to ${status}`
      }
    });

    return updated;
  }
}
