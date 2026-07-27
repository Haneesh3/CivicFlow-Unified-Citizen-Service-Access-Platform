import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
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
}
