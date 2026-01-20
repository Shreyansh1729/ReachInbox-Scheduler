import { redisConnection } from '../config/redis';

export class RateLimitService {
    private static KEY_PREFIX = 'limit:user';

    static getHourKey(userId: string, timestamp: number) {
        const date = new Date(timestamp);
        const hour = date.toISOString().slice(0, 13); // 2024-01-20T14
        return `${this.KEY_PREFIX}:${userId}:${hour}`;
    }

    static async checkLimit(userId: string, limit: number): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
        const key = this.getHourKey(userId, Date.now());

        // Atomic increment first (Token Bucket style)
        // We assume we want to consume 1 token.
        // If the new value > limit, we are throttled.
        const currentUsage = await redisConnection.incr(key);

        // Set expiry on first use
        if (currentUsage === 1) {
            await redisConnection.expire(key, 3600);
        }

        if (currentUsage > limit) {
            // Calculate time until next hour
            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1);
            nextHour.setMinutes(0, 0, 0);
            const delay = nextHour.getTime() - now.getTime();
            return { allowed: false, remaining: 0, retryAfter: delay };
        }

        return { allowed: true, remaining: limit - currentUsage };
    }

    // No-op as we increment in check
    static async increment(userId: string) {
        return;
    }
}
