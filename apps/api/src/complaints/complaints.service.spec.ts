import { ComplaintStatus } from '@prisma/client';
import { ComplaintsService } from './complaints.service';

describe('ComplaintsService', () => {
  it('persists ratings when a complaint is marked resolved', async () => {
    const prisma = {
      complaint: {
        update: jest.fn().mockResolvedValue({ id: 'complaint-1', status: ComplaintStatus.RESOLVED }),
      },
      complaintUpdate: {
        create: jest.fn().mockResolvedValue({ id: 'update-1' }),
      },
    };

    const complaintActivityService = {
      logActivity: jest.fn().mockResolvedValue(undefined),
    };

    const service = new ComplaintsService(prisma as any, complaintActivityService as any);

    await service.update('complaint-1', {
      status: ComplaintStatus.RESOLVED,
      rating: 5,
      ratingComment: 'Excellent service',
      comment: 'Issue cleared',
    });

    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'complaint-1' },
        data: expect.objectContaining({
          status: ComplaintStatus.RESOLVED,
          rating: 5,
          ratingComment: 'Excellent service',
        }),
      })
    );
  });
});
