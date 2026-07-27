import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(serviceId: string, serviceCenterId: string, date: string) {
    const bookingDate = new Date(date);
    bookingDate.setUTCHours(0, 0, 0, 0);

    // 1. Check if date is a holiday
    const isHoliday = await this.prisma.holiday.findUnique({
      where: { date: bookingDate },
    });

    if (isHoliday) {
      return { status: 'CLOSED', message: `Closed due to ${isHoliday.name}`, slots: [] };
    }

    // 2. Check if date is in the past or less than 24h away
    const now = new Date();
    const minBookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Now + 24h
    
    // 3. Define standard slots (9 AM to 5 PM)
    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    // 4. Filter slots based on 24h rule
    const availableSlots = allSlots.filter(slot => {
      const [time, period] = slot.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const slotDateTime = new Date(bookingDate);
      slotDateTime.setUTCHours(hours, minutes, 0, 0);

      return slotDateTime.getTime() > minBookingDate.getTime();
    });

    // 5. Filter out already booked slots
    const bookedApplications = await this.prisma.serviceApplication.findMany({
      where: {
        serviceId,
        serviceCenterId,
        appointmentDate: bookingDate,
      },
      select: { appointmentSlot: true }
    });

    const bookedSlots = bookedApplications.map(a => a.appointmentSlot);
    const finalSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));

    return {
      status: 'OPEN',
      date: bookingDate.toISOString(),
      slots: finalSlots
    };
  }

  async getServiceDetails(serviceId: string) {
    return this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        subServices: true,
        serviceCenters: true
      }
    });
  }

  async getAllHolidays() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
  }
}
