import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
