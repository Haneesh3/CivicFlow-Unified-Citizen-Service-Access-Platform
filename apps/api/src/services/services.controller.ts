import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly authService: AuthService
  ) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/me')
  async findMyApplications(@Request() req: any) {
    // Sync applications before returning
    await this.authService.syncUserData(req.user.id);
    return this.servicesService.findUserApplications(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/all')
  findAllApplications(@Request() req: any) {
    return this.servicesService.findAllApplications(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('applications/:id')
  updateApplication(
    @Param('id') id: string,
    @Body() body: { status: string; comment?: string }
  ) {
    return this.servicesService.updateApplicationStatus(id, body.status, body.comment);
  }

  @Get('applications/reference/:referenceId')
  findByReference(@Param('referenceId') referenceId: string) {
    return this.servicesService.findByReferenceId(referenceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications')
  createApplication(@Request() req: any, @Body() data: any) {
    return this.servicesService.createApplication(req.user.id, data);
  }
}
