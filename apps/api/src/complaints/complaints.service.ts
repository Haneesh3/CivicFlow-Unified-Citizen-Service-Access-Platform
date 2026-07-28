import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ComplaintStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { ComplaintActivityService } from './complaint-activity.service';

interface ComplaintUpdatePayload {
  status: ComplaintStatus;
  comment?: string;
  rating?: number;
  ratingComment?: string;
}

@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private complaintActivityService: ComplaintActivityService,
  ) {}

  getCityFromCoords(lat: number, lng: number): string {
    // Chennai: lat ~ 13.08, lng ~ 80.27
    if (Math.abs(lat - 13.08) < 1.5 && Math.abs(lng - 80.27) < 1.5) {
      return 'Chennai';
    }
    // Mumbai: lat ~ 19.07, lng ~ 72.87
    if (Math.abs(lat - 19.07) < 1.5 && Math.abs(lng - 72.87) < 1.5) {
      return 'Mumbai';
    }
    // Bengaluru: lat ~ 12.97, lng ~ 77.59
    if (Math.abs(lat - 12.97) < 1.5 && Math.abs(lng - 77.59) < 1.5) {
      return 'Bengaluru';
    }
    // Delhi: lat ~ 28.61, lng ~ 77.20
    if (Math.abs(lat - 28.61) < 2.0 && Math.abs(lng - 77.20) < 2.0) {
      return 'Delhi';
    }
    return 'Delhi';
  }

  async create(userId: string, createDto: CreateComplaintDto) {
    const { title, description, category, latitude, longitude, address, force } = createDto;

    // Duplicate detection
    if (!force) {
      const duplicates: any[] = await this.prisma.$queryRaw`
        SELECT id FROM "Complaint"
        WHERE category = ${category}
        AND "createdAt" > now() - interval '24 hours'
        AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 50, false)
        LIMIT 1
      `;

      if (duplicates && duplicates.length > 0) {
        throw new BadRequestException('A similar complaint was recently reported at this location. Please track the existing issue.');
      }
    }

    // Auto-update user's profile city if not already set or mismatch
    try {
      const detectedCity = this.getCityFromCoords(latitude, longitude);
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && (!user.city || user.city.toLowerCase() !== detectedCity.toLowerCase())) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { city: detectedCity }
        });
      }
    } catch (e) {
      console.warn('Failed to update user city on complaint submission:', e);
    }

    const complaintId = uuid();

    await this.prisma.$executeRaw`
      INSERT INTO "Complaint" (id, title, description, category, status, "userId", address, "updatedAt", geom)
      VALUES (${complaintId}, ${title}, ${description}, ${category}, 'SUBMITTED', ${userId}, ${address}, now(), ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
    `;

    await this.complaintActivityService.logActivity(complaintId, 'created', {
      title,
      category,
      address,
    });

    return this.prisma.complaint.findUnique({
      where: { id: complaintId }
    });
  }

  async findAll(user?: any) {
    const whereClause: any = {};
    if (user && user.role === 'ADMIN' && user.city) {
      whereClause.user = {
        city: {
          equals: user.city,
          mode: 'insensitive'
        }
      };
    }

    return this.prisma.complaint.findMany({
      where: whereClause,
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getNearby(latitude: number, longitude: number, radius: number = 1000) {
    return this.prisma.$queryRaw`
      SELECT id, title, category, status, address, ST_X(geom::geometry) as longitude, ST_Y(geom::geometry) as latitude
      FROM "Complaint"
      WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ${radius}, false)
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;
  }

  async findByUser(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async update(id: string, data: ComplaintUpdatePayload) {
    const { status, comment, rating, ratingComment } = data;

    const updateData: Record<string, unknown> = { status };

    if (typeof rating === 'number') {
      updateData.rating = rating;
    }

    if (ratingComment) {
      updateData.ratingComment = ratingComment;
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.complaintUpdate.create({
      data: {
        complaintId: id,
        status,
        comment: comment || `Status updated to ${status}`,
      }
    });

    await this.complaintActivityService.logActivity(id, 'status_updated', {
      status,
      comment: comment || `Status updated to ${status}`,
      rating,
      ratingComment,
    });

    return updatedComplaint;
  }
}
