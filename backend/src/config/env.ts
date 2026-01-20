import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    PORT: z.string().default("4000"),
    CONCURRENCY: z.string().default("5").transform(Number),
    ETHEREAL_USER: z.string().default(""),
    ETHEREAL_PASS: z.string().default(""),
});

export const env = envSchema.parse(process.env);
