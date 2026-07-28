import { Controller, Post, Body, UseGuards, Request, Get, Query, Patch, Param, HttpCode } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { ComplaintStatus } from '@prisma/client';

@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly authService: AuthService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createComplaintDto: CreateComplaintDto) {
    return this.complaintsService.create(req.user.id, createComplaintDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    return this.complaintsService.findAll(req.user);
  }

  @Get('nearby')
  getNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.complaintsService.getNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius, 10) : 1000
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMyComplaints(@Request() req: any) {
    // Sync data before returning to ensure data is up to date
    await this.authService.syncUserData(req.user.id);
    return this.complaintsService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() data: { status: ComplaintStatus; comment?: string; rating?: number; ratingComment?: string }
  ) {
    return this.complaintsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reopen')
  @HttpCode(200)
  async reopenComplaint(
    @Param('id') id: string,
    @Body() body: { comment?: string }
  ) {
    return this.complaintsService.update(id, {
      status: ComplaintStatus.REOPENED,
      comment: body.comment || 'Citizen reopened the ticket after review.',
    });
  }
}
