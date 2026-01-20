import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { CampaignController } from './controllers/campaign.controller';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // For CSV payloads

app.post('/api/schedule', CampaignController.schedule);
app.get('/api/campaigns/:campaignId/stats', CampaignController.getAnalytics);

// User/Emails helpers for frontend
app.get('/api/users/:userId/emails', async (req, res) => {
    const emails = await prisma.email.findMany({
        where: { campaign: { userId: req.params.userId } },
        orderBy: { sentAt: 'desc' },
        take: 50
    });
    res.json(emails);
});
app.get('/api/users/:userId/stats', async (req, res) => {
    const scheduled = await prisma.email.count({ where: { campaign: { userId: req.params.userId }, status: 'PENDING' } });
    const sent = await prisma.email.count({ where: { campaign: { userId: req.params.userId }, status: 'SENT' } });
    const failed = await prisma.email.count({ where: { campaign: { userId: req.params.userId }, status: 'FAILED' } });
    res.json({ scheduled, sent, failed });
});

// Quick debug endpoint to create a user
app.post('/api/users', async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: { email: req.body.email, name: req.body.name }
        });
        res.json(user);
    } catch (e) { res.status(400).json(e) }
});

app.listen(env.PORT, () => {
    console.log(`API Server running on port ${env.PORT}`);
});
