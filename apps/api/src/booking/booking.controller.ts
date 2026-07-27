import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('details/:serviceId')
  getServiceDetails(@Param('serviceId') serviceId: string) {
    return this.bookingService.getServiceDetails(serviceId);
  }

  @Get('slots')
  getAvailableSlots(
    @Query('serviceId') serviceId: string,
    @Query('serviceCenterId') serviceCenterId: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.getAvailableSlots(serviceId, serviceCenterId, date);
  }

  @Get('holidays')
  getHolidays() {
    return this.bookingService.getAllHolidays();
  }
}
