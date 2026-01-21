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

        // 0. Idempotency Check: Prevent duplicate sends on retry
        const existingEmail = await prisma.email.findUnique({ where: { id: emailId } });
        if (existingEmail && existingEmail.status === 'SENT') {
            console.log(`[Job ${job.id}] Skipped (Already SENT)`);
            return;
        }

        // 1. Check Rate Limit
        const limitStatus = await RateLimitService.checkLimit(userId, limitParams);

        if (!limitStatus.allowed) {
            const delay = limitStatus.retryAfter || 60000;
            console.log(`[Job ${job.id}] ⏳ Rate limit hit. Rescheduling in ${delay}ms`);

            // Update DB status to THROTTLED so UI knows
            await prisma.email.update({
                where: { id: emailId },
                data: { status: 'THROTTLED' }
            });

            // Re-queue the job efficiently
            await job.moveToDelayed(Date.now() + delay, job.token);
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
