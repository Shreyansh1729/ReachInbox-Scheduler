# 🚀 Full Stack Deployment Guide (Railway.app)

I see your screen! You are at the "New Project" menu. Follow this exact order:

## PHASE 1: Databases (Click "Database" first)

1.  **On your current screen**, click **"Database"**.
2.  Select **"PostgreSQL"**.
    *   *Wait a moment for it to appear on the canvas.*
3.  **Right-click** anywhere on the empty dark canvas area.
4.  Select **"Add new service"** -> **"Database"** -> **"Redis"**.
    *   *Now you should see two boxes: "PostgreSQL" and "Redis".*

**Getting your Variables:**
1.  Click the **PostgreSQL box**.
2.  Go to the **"Variables"** tab.
3.  Click the "Eye" icon to reveal `DATABASE_URL`. **Copy it**.
4.  Do the same for the **Redis box**, copy the `REDIS_URL`.

---

## PHASE 2: Backend (API)

1.  Press `Cmd + K` (or click "New") -> Select **"GitHub Repository"**.
2.  Choose your repo: `ReachInbox-Scheduler`.
3.  **Click the new box** that appears (it might fail to build first/red, that's okay).
4.  Go to **"Settings"** -> **"General"** -> Scroll down to **"Root Directory"**.
5.  Type: `backend` and hit Enter/Save.
6.  Go to **"Variables"** tab. Add these:
    *   `DATABASE_URL`: *Paste from Phase 1*
    *   `REDIS_URL`: *Paste from Phase 1*
    *   `PORT`: `4000`
    *   `JWT_SECRET`: `any-random-secret-word`
    *   `ETHEREAL_USER`: *Leave empty (will auto-generate)*
    *   `ETHEREAL_PASS`: *Leave empty*
7.  Go to **"Settings"** -> **"Networking"**.
8.  Click **"Generate Domain"**.
9.  **COPY THIS DOMAIN** (e.g. `backend-production.up.railway.app`).

---

## PHASE 3: Backend (Worker)

1.  Press `Cmd + K` -> **"GitHub Repository"**.
2.  Select the **SAME** repo again (`ReachInbox-Scheduler`).
3.  Click the new box.
4.  Go to **"Settings"** -> **"General"**.
5.  **Root Directory**: `backend`
6.  Scroll down to **"Build"** -> **"Start Command"**.
7.  Type: `npm run start:worker`
8.  Go to **"Variables"** tab.
    *   Add the **SAME variables** as Phase 2 (`DATABASE_URL`, `REDIS_URL`, etc).
    *   *No Domain needed for this one.*

---

## PHASE 4: Frontend

1.  Press `Cmd + K` -> **"GitHub Repository"**.
2.  Select the repo again (`ReachInbox-Scheduler`).
3.  Click the box.
4.  Go to **"Settings"** -> **"General"**.
5.  **Root Directory**: `frontend`
6.  Go to **"Variables"**. Add these:
    *   `NEXTAUTH_URL`: *Leave empty for now*
    *   `NEXTAUTH_SECRET`: `any-random-secret-string`
    *   `GOOGLE_CLIENT_ID`: *Your Google ID*
    *   `GOOGLE_CLIENT_SECRET`: *Your Google Secret*
    *   `NEXT_PUBLIC_API_URL`: **Paste the Backend Domain from Phase 2** (Start with `https://`)
7.  Go to **"Settings"** -> **"Networking"**.
8.  Click **"Generate Domain"**.
9.  **Copy this domain**.
10. Go back to **"Variables"** and update `NEXTAUTH_URL` with this full domain (e.g., `https://frontend-production...`).
11. **Redeploy** (Click "Deployments" -> "Redeploy").

---

## 🚨 FINAL CHECKLIST (Follow these exactly)

The "Failed to schedule" error means the Frontend can't find the Backend. Check these 3 settings:

### 1. Fix the Worker (`vivacious-simplicity`)
You put the command in the wrong box!
1.  Go to `vivacious-simplicity` -> **Settings** -> **Build**.
2.  **DELETE** everything from the **"Build Command"** box (it should be empty).
3.  Scroll down to the **"Deploy"** section.
4.  Find the **"Start Command"** box and type: `npm run start:worker`
5.  Click **Save**.

### 2. Match the Ports (Important!)
Railway uses port **8080** by default, but it might be trying to find your app on 3000.
1.  Go to **Frontend** (`rare-endurance`) -> **Settings** -> **Networking**.
2.  Find the **"Port"** field. Change it to **`8080`**. (Save)
3.  Go to **Backend** (`ReachInbox-Scheduler`) -> **Settings** -> **Networking**.
4.  Find the **"Port"** field. Change it to **`8080`**. (Save)

### 3. Verify the Frontend Variable
1.  Go to **Frontend** (`rare-endurance`) -> **Variables**.
2.  Ensure you have **`NEXT_PUBLIC_API_URL`** (Must be this name!).
3.  Value MUST be the full backend URL: `https://reachinbox-scheduler-production.up.railway.app`
    *   **NO** slash at the end.
    *   **MUST** start with `https://`.

---

## ❓ Troubleshooting: "No Repository Found?"

If you don't see `ReachInbox-Scheduler` in the list, it's because Railway doesn't have permission to see your **new private repo** yet.

1.  Go to **GitHub Settings**: [https://github.com/settings/installations](https://github.com/settings/installations)
2.  Find **"Railway"** and click **Configure**.
3.  Scroll to **"Repository access"**.
4.  Select **"All repositories"** OR manually pick `ReachInbox-Scheduler`.
5.  **Save** and Refresh Railway.
