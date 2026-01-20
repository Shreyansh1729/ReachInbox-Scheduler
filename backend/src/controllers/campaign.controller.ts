import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../jobs/queues';
import { z } from 'zod';

const prisma = new PrismaClient();

const ScheduleSchema = z.object({
    userId: z.string(), // In real app, get from Auth context
    subject: z.string(),
    body: z.string(),
    startTime: z.string().optional(), // ISO String
    minDelay: z.number().default(0),    // Seconds
    hourlyLimit: z.number().default(100),
    recipients: z.array(z.string().email()),
});

export class CampaignController {
    static async schedule(req: Request, res: Response) {
        try {
            const data = ScheduleSchema.parse(req.body);
            const startTimeDate = data.startTime ? new Date(data.startTime) : new Date();

            // 1. Create Campaign
            const campaign = await prisma.campaign.create({
                data: {
                    name: data.subject.slice(0, 50),
                    userId: data.userId,
                    minDelay: data.minDelay,
                    hourlyLimit: data.hourlyLimit,
                    scheduleAt: startTimeDate,
                }
            });

            // 2. Create Emails & Jobs
            let currentDelay = 0;
            // If start time is in future, initial delay is difference
            const initialDelay = Math.max(0, startTimeDate.getTime() - Date.now());

            const emailPromises = data.recipients.map(async (recipient, index) => {
                // Calculate delay: Initial + (Index * gap)
                // If minDelay is 10s: 0s, 10s, 20s...
                const jobDelay = initialDelay + (index * (data.minDelay * 1000));

                const email = await prisma.email.create({
                    data: {
                        campaignId: campaign.id,
                        recipient,
                        subject: data.subject,
                        body: data.body,
                        status: 'PENDING'
                    }
                });

                await emailQueue.add('send-email', {
                    emailId: email.id,
                    userId: data.userId,
                    campaignId: campaign.id,
                    to: recipient,
                    subject: data.subject,
                    body: data.body,
                    hourlyLimit: data.hourlyLimit
                }, {
                    delay: jobDelay,
                    jobId: `email-${email.id}` // Deduplication
                });
            });

            await Promise.all(emailPromises);

            res.json({ success: true, campaignId: campaign.id, count: data.recipients.length });

        } catch (e) {
            console.error(e);
            res.status(400).json({ error: e });
        }
    }

    static async getAnalytics(req: Request, res: Response) {
        const { campaignId } = req.params;
        // Simple stats
        const stats = await prisma.email.groupBy({
            by: ['status'],
            where: { campaignId: String(campaignId) },
            _count: true
        });
        res.json(stats);
    }
}
