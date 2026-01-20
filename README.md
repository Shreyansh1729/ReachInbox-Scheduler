# ReachInbox Scheduler Assignment

A full-stack email scheduling system built with **Node.js, Express, BullMQ, Redis, and Next.js**.
Designed to handle high throughput, enforce rate limits, and survive server restarts without data loss.

## Features

- **Reliable Scheduling**: Uses **BullMQ** delayed jobs (no OS cron) to schedule emails.
- **Persistence**: Redis AOF + Postgres ensures jobs survive server crashes/restarts.
- **Rate Limiting**:
  - Enforces **User-defined Hourly Limits**.
  - **Does not drop** emails when limit is hit; automatically reschedules them for the next hour window.
  - Safe concurrency across multiple workers using Redis atomic counters.
- **Concurrency**: Configurable worker concurrency handling multiple jobs in parallel.
- **Frontend Dashboard**:
  - OAuth Login (Google).
  - Real-time stats (Scheduled, Sent, Failed).
  - Bulk Schedule via CSV Upload.

##  Tech Stack

- **Backend**: Express, TypeScript, BullMQ (Redis), Prisma (Postgres).
- **Frontend**: Next.js 14, Tailwind CSS, Tanstack Query, NextAuth.
- **Infrastructure**: Docker Compose (Redis, Postgres).

##  Quick Start

### 1. Requirements
- Node.js 18+
- Docker & Docker Compose

### 2. Setup

```bash
# 1. Clone & Install
cd assignment
cd backend && npm install
cd ../frontend && npm install

# 2. Start Infrastructure (Redis & DB)
cd ../backend
docker-compose up -d

# 3. Setup Database
npx prisma db push
npx prisma generate

# 4. Start Backend Services
# Terminal A (API)
npm run dev:api

# Terminal B (Worker)
npm run dev:worker

# 5. Start Frontend
# Terminal C
cd ../frontend
npm run dev
```

### 3. Testing the App
1. Open `http://localhost:3000`.
2. Login (Simulated Google Auth).
3. Go to "Compose".
4. Upload `leads.csv` (sample provided below).
5. Set **Hourly Limit** to `2` and **Min Delay** to `5`.
6. Watch the Dashboard updates.

##  Architecture

### Data Flow
1. **Client** uploads CSV → **API** creates `Campaign` & `Email` records (Postgres).
2. **API** creates delayed jobs in **Redis** (BullMQ).
3. **Worker** wakes up at scheduled time.
4. **Worker** checks **Redis Rate Limit Key** (`limit:userId:hour`).
   - ✅ **Allowed**: Sends email via Ethereal SMTP, updates DB, increments counter.
   - ❌ **Limit Exceeded**: Calculates delay until next hour, **reschedules** job.

### Rate Limiting & Concurrency
- **Rate Limiting**: Implemented using **Redis Atomic Counters** (`INCR`). We track usage per user per hour (`limit:userId:hour`). If the limit is exceeded, the job is not dropped but rescheduled (`moveToDelayed`) to the start of the next hour window.
- **Concurrency**: Controlled by the `CONCURRENCY` environment variable passed to the BullMQ Worker options. This allows processing multiple emails in parallel (e.g., 5 at a time) per worker instance. Multiple worker instances can run safely due to Redis's atomic operations.

### Persistence Strategy
- **Redis AOF** (`appendonly yes`): Ensures queue state is saved to disk immediately. If Docker crashes, the queue restores perfectly on restart.
- **Postgres**: Permanent record of campaign history and status.

##  Configuration (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `CONCURRENCY` | Number of parallel jobs per worker | `5` |
| `MAX_EMAILS_PER_HOUR` | Global fallback limit | `50` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |

##  Testing Scenarios

### 1. Server Restart
*Start a campaign. Kill the `npm run dev:worker` process. Wait a minute. Restart it.*
**Result**: The worker resumes processing pending jobs. No emails are lost or duplicated.

### 2. Rate Limiting
*Set limit to 10/hour. Schedule 20 emails.*
**Result**: 10 send immediately. The remaining 10 are rescheduled for exactly 1 hour later.

---

## ✅ Features Implemented Checklist

### Backend
| Requirement | Status | Notes |
|-------------|--------|-------|
| API to schedule emails | ✅ | `POST /api/schedule` |
| Persist to relational DB | ✅ | Prisma + Postgres |
| BullMQ delayed jobs (no cron) | ✅ | Calculated delay per email |
| Redis for queue persistence | ✅ | AOF enabled |
| Ethereal SMTP integration | ✅ | Auto-generates test accounts |
| Jobs survive server restart | ✅ | Redis + Postgres persistence |
| Idempotent job IDs | ✅ | `jobId: 'email-${email.id}'` |
| Configurable concurrency | ✅ | Via `CONCURRENCY` env var |
| Min delay between emails | ✅ | `minDelay` per campaign |
| Hourly rate limiting | ✅ | Redis atomic counters |
| Rate limit across workers | ✅ | Shared Redis keys |
| Jobs rescheduled (not dropped) | ✅ | `moveToDelayed()` on throttle |

### Frontend
| Requirement | Status | Notes |
|-------------|--------|-------|
| Google OAuth login | ✅ | NextAuth GoogleProvider |
| Dashboard with Name/Email/Avatar | ✅ | Header displays user info |
| Logout functionality | ✅ | `signOut()` button |
| Scheduled Emails table | ✅ | With loading/empty states |
| Sent Emails table | ✅ | With loading/empty states |
| Compose form (Subject/Body) | ✅ | React Hook Form |
| CSV upload & parsing | ✅ | PapaParse |
| Email count display | ✅ | Shows parsed count |
| Start time selection | ✅ | datetime-local input |
| Delay between emails | ✅ | minDelay input |
| Hourly limit input | ✅ | hourlyLimit input |
| TypeScript types | ✅ | Interfaces for Email, FormValues |
| Reusable components | ✅ | DataTable component |

---

## ⚠️ Assumptions & Trade-offs

### Assumptions
1. **Single Ethereal Account**: For demo purposes, all emails are sent from a single Ethereal test account. In production, rotate multiple sender accounts.
2. **User ID from Frontend**: The `userId` is passed from the frontend session. In production, extract from a verified JWT token server-side.
3. **Hourly Rate Limit Window**: Uses fixed-hour windows (e.g., 2:00-3:00 PM). Alternative: sliding window for smoother distribution.
4. **No Email Templates**: Body is plain text/HTML. A production system would have templating (Handlebars, Mjml).

### Trade-offs
1. **`moveToDelayed()` inside Worker**: BullMQ recommends external rate limiters. Our approach is simpler but relies on job token availability.
2. **Polling Dashboard**: Frontend polls every 5s. WebSockets would be more efficient at scale.
3. **removeOnFail: false**: Failed jobs accumulate for debugging. Add cleanup logic for production.
4. **No Bulk Insert**: Emails are created one-by-one. `createMany` would be faster for 1000+ recipients.

### Known Limitations
- **No email preview/edit** after scheduling.
- **No campaign cancellation** feature (would require `job.remove()`).
- **No webhook/callback** on email delivery.

---

## 🔧 Ethereal Email Setup

[Ethereal](https://ethereal.email/) is a fake SMTP service for testing.

### Option 1: Auto-Generate (Default)
Leave `ETHEREAL_USER` and `ETHEREAL_PASS` empty or as `dummy`. The worker will auto-generate a transient account on first email send. Check console logs for the preview URL.

### Option 2: Stable Account
1. Go to https://ethereal.email/
2. Click **"Create Ethereal Account"**
3. Copy credentials to `backend/.env`:
   ```
   ETHEREAL_USER=your.generated@ethereal.email
   ETHEREAL_PASS=yourpassword
   ```
4. View sent emails at https://ethereal.email/messages

---

**Submission for ReachInbox**

