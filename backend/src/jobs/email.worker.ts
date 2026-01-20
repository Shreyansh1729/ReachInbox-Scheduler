import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { PrismaClient } from '@prisma/client';
import { RateLimitService } from '../services/rate-limit.service';
import { EmailService } from '../services/email.service';
import { env } from '../config/env';

const prisma = new PrismaClient();

interface EmailJobData {
    emailId: string;
    userId: string;
    campaignId: string | null;
    to: string;
    subject: string;
    body: string;
    hourlyLimit?: number;
}

export const emailWorker = new Worker<EmailJobData>(
    'email-sending-queue',
    async (job: Job<EmailJobData>) => {
        const { emailId, userId, to, subject, body, hourlyLimit } = job.data;

        // Default to 10 if not provided
        const limitParams = hourlyLimit || 10;

        console.log(`[Job ${job.id}] Processing email to ${to} for user ${userId}`);

        // 1. Check Rate Limit
        const limitStatus = await RateLimitService.checkLimit(userId, limitParams);

        if (!limitStatus.allowed) {
            console.log(`[Job ${job.id}] Rate limit hit. Rescheduling in ${limitStatus.retryAfter}ms`);
            // Update DB status
            await prisma.email.update({
                where: { id: emailId },
                data: { status: 'THROTTLED' }
            });

            // Move to delayed
            await job.moveToDelayed(Date.now() + (limitStatus.retryAfter || 60000), job.token); // this requires token
            // Actually, inside a worker, throwing an error or using moveToDelayed is tricky. 
            // The best way for 'rate limited' is to throw a specific error that causes a delay, 
            // OR return and let the caller handle it. 
            // But throwing `Worker.RateLimitError` is standard for "try again later".
            // However, we want SPECIFIC delay.
            // `moveToDelayed` needs the token which is available on the job.
            // We will return here to stop processing.
            return;
        }

        try {
            // 2. Send Email
            await EmailService.sendEmail(to, subject, body);

            // 3. Update DB
            await prisma.email.update({
                where: { id: emailId },
                data: { status: 'SENT', sentAt: new Date() }
            });

            // 4. Increment Counter
            await RateLimitService.increment(userId);

            console.log(`[Job ${job.id}] Email Sent Successfully`);
        } catch (error) {
            console.error(`[Job ${job.id}] Failed`, error);
            await prisma.email.update({
                where: { id: emailId },
                data: { status: 'FAILED' }
            });
            throw error;
        }
    },
    {
        connection: redisConnection as any,
        concurrency: env.CONCURRENCY,
        limiter: {
            max: 1,      // 1 job
            duration: 1000 // per 1 second (Global Throttle for SMTP safety)
        }
    }
);
