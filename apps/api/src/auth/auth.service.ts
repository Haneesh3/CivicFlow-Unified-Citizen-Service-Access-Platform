import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
  }

  private normalizeRole(role?: string): Role | undefined {
    if (!role) {
      return undefined;
    }

    const normalizedRole = role.trim().toUpperCase();

    switch (normalizedRole) {
      case 'USER':
      case 'CITIZEN':
        return Role.CITIZEN;
      case 'ADMIN':
        return Role.ADMIN;
      case 'STAFF':
      case 'OFFICER':
        return Role.STAFF;
      default:
        return normalizedRole as Role;
    }
  }


  private isRoleAllowed(userRole: string, requestedRole?: string): boolean {
    const normalizedUserRole = (this.normalizeRole(userRole) || 'CITIZEN') as any;

    // Admins and Super Admins are always authorized to log in
    if (normalizedUserRole === 'ADMIN' || normalizedUserRole === 'SUPER_ADMIN') {
      return true;
    }

    const normalizedRequestedRole = (this.normalizeRole(requestedRole)) as any;

    if (!normalizedRequestedRole) {
      return true;
    }

    if (normalizedRequestedRole === 'ADMIN') {
      return normalizedUserRole === 'ADMIN' || normalizedUserRole === 'STAFF';
    }

    return normalizedUserRole === normalizedRequestedRole;
  }

  async register(registerDto: RegisterDto) {
    const { email, phone, password, name, city, language, role } = registerDto;
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

    if (!normalizedEmail && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail || 'NONE' },
          { phone: phone || 'NONE' }
        ]
      }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        phone,
        password: hashedPassword,
        name,
        city,
        language,
        role: this.normalizeRole(role) || Role.CITIZEN
      }
    });

    return this.login({ email: user.email || undefined, phone: user.phone || undefined, password });
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password, role } = loginDto;
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

    if (!normalizedEmail && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail || 'NONE' },
          { phone: phone || 'NONE' }
        ]
      }
    });

    // If user not found locally, try Supabase fallback
    if (!user) {
      if (normalizedEmail) {
        try {
          const { data, error } = await this.supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (!error && data.user) {
            // Supabase login success! Create user locally for future use
            user = await this.prisma.user.create({
              data: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'Supabase User',
                password: await bcrypt.hash(password, 10),
                role: data.user.user_metadata?.role || 'CITIZEN',
              }
            });
            
            // Trigger Sync
            await this.syncUserData(user.id);
          }
        } catch (supabaseError) {
          console.error('Supabase fallback error:', supabaseError);
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If we found a local user, verify password (unless we just came from a successful Supabase sync)
    // Note: If we just created the user above, bcrypt.compare will still work because we hashed it.
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.isRoleAllowed(user.role, role)) {
      throw new UnauthorizedException('This account is not authorized for the selected role');
    }

    const payload = { sub: user.id, role: user.role, name: user.name };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  }

  async syncUserData(userId: string) {
    try {
      console.log(`Syncing data for user: ${userId}`);
      
      // 1. Sync Complaints
      const { data: complaints } = await this.supabase
        .from('Complaint')
        .select('*')
        .eq('userId', userId);

      if (complaints && complaints.length > 0) {
        for (const comp of complaints) {
          await this.prisma.complaint.upsert({
            where: { id: comp.id },
            update: {},
            create: {
              id: comp.id,
              title: comp.title,
              description: comp.description,
              category: comp.category,
              status: comp.status,
              userId: comp.userId,
              address: comp.address,
              createdAt: new Date(comp.createdAt),
              updatedAt: new Date(comp.updatedAt),
            }
          });

          // Sync Updates
          const { data: updates } = await this.supabase
            .from('ComplaintUpdate')
            .select('*')
            .eq('complaintId', comp.id);
          
          if (updates && updates.length > 0) {
            for (const update of updates) {
              await this.prisma.complaintUpdate.upsert({
                where: { id: update.id },
                update: {},
                create: {
                  id: update.id,
                  complaintId: update.complaintId,
                  status: update.status,
                  comment: update.comment,
                  createdAt: new Date(update.createdAt),
                }
              });
            }
          }
        }
      }

      // 2. Sync Applications
      const { data: apps } = await this.supabase
        .from('ServiceApplication')
        .select('*')
        .eq('userId', userId);

      if (apps && apps.length > 0) {
        for (const app of apps) {
          await this.prisma.serviceApplication.upsert({
            where: { id: app.id },
            update: {},
            create: {
              id: app.id,
              serviceId: app.serviceId,
              userId: app.userId,
              applicantName: app.applicantName,
              applicantPhone: app.applicantPhone,
              data: app.data || {},
              status: app.status,
              referenceId: app.referenceId,
              createdAt: new Date(app.createdAt),
              updatedAt: new Date(app.updatedAt),
            }
          });
        }
      }
      
      console.log('Sync completed successfully.');
    } catch (error) {
      console.error('Error in syncUserData:', error);
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      return { message: 'If this email is registered, a password reset code has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: otp,
        resetTokenExpires: expiry,
      },
    });

    const webResetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&token=${otp}`;
    await this.mailService.sendPasswordResetEmail(email, otp, webResetLink);

    return { message: 'Verification code sent to registered email address.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const email = resetPasswordDto.email.trim().toLowerCase();
    const token = resetPasswordDto.token.trim();
    const { newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!user || !user.resetToken || !user.resetTokenExpires) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (new Date() > user.resetTokenExpires) {
      throw new BadRequestException('Password reset token has expired');
    }

    if (user.resetToken !== token) {
      throw new BadRequestException('Invalid password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Password has been successfully updated.' };
  }
}
