import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(id: string, data: { name?: string; email?: string; phone?: string; city?: string; language?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });
  }

  async updateRole(id: string, role: any) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        role: true
      }
    });
  }

  async createAdmin(data: { name: string; email: string; phone?: string; city?: string }) {
    const { name, email, phone, city } = data;
    const hashedPassword = await bcrypt.hash('user123user', 10);
    return this.prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        phone,
        city,
        password: hashedPassword,
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
  }
}
