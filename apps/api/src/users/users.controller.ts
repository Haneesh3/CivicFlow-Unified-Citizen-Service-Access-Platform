import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    // Sync data on profile fetch to ensure historical data is pulled from Supabase
    await this.authService.syncUserData(req.user.id);
    
    const user = await this.usersService.updateProfile(req.user.id, {});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() data: { name?: string; email?: string; phone?: string; city?: string; language?: string }) {
    const user = await this.usersService.updateProfile(req.user.id, data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() data: { password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.usersService.updatePassword(req.user.id, hashedPassword);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllUsers(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Only Super Admins can access this list.');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/role')
  async updateRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { role: string }
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Only Super Admins can assign roles.');
    }
    return this.usersService.updateRole(id, body.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-admin')
  async createAdmin(
    @Request() req: any,
    @Body() body: { name: string; email: string; phone?: string; city?: string }
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Only Super Admins can register new administrators.');
    }
    return this.usersService.createAdmin(body);
  }
}
