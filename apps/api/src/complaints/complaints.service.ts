import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateComplaintDto) {
    const { title, description, category, latitude, longitude, address } = createDto;

    // Duplicate detection
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

    const complaintId = uuid();

    await this.prisma.$executeRaw`
      INSERT INTO "Complaint" (id, title, description, category, status, "userId", address, "updatedAt", geom)
      VALUES (${complaintId}, ${title}, ${description}, ${category}, 'SUBMITTED', ${userId}, ${address}, now(), ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
    `;

    return this.prisma.complaint.findUnique({
      where: { id: complaintId }
    });
  }

  async findAll() {
    return this.prisma.complaint.findMany({
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
}
