# Vercel Deployment Setup Guide

## The Problem
Your authentication was using **localStorage** which is browser-specific. When you sign up in Browser A, the account is stored in Browser A's localStorage. When you open Browser B, it has no data, so it shows "credentials not found".

## The Solution
I've updated your authentication to use the **Neon database** via your API server. Now accounts are stored in the database and shared across all browsers.

## Steps to Fix on Vercel

### 1. Deploy Your API Server

You have two options:

#### Option A: Deploy API as Separate Service (Recommended)
- Deploy your API server to **Railway**, **Render**, or **Fly.io**
- Get the API URL (e.g., `https://your-api.railway.app`)

#### Option B: Use Vercel Serverless Functions
- Convert your Express routes to Vercel serverless functions
- Place them in `api/` directory

### 2. Set Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
VITE_API_URL=https://your-api-url.com
DATABASE_URL=your-neon-connection-string
JWT_SECRET=your-secret-key-change-this
```

**Important**: 
- `VITE_API_URL` must start with `VITE_` to be accessible in the frontend
- Replace `your-api-url.com` with your actual API server URL
- Use a strong random string for `JWT_SECRET`

### 3. Update Database Schema

You need to add a `password_hash` column to your users table:

```sql
ALTER TABLE users ADD COLUMN password_hash TEXT;
```

Or create a migration:

```bash
cd PesoPlan
npx prisma migrate dev --name add_password_hash
```

Then update `prisma/schema.prisma`:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password_hash String?
  created_at   DateTime @default(now())
  // ... rest of model
}
```

### 4. Install Dependencies

Make sure these are installed:

```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 5. Redeploy

After setting environment variables:
1. Push your changes to GitHub
2. Vercel will automatically redeploy
3. Test signup/login in different browsers

## Testing

1. **Sign up** in Browser A (Chrome)
2. **Sign in** in Browser B (Firefox) with the same credentials
3. Both should work! ✅

## Current Status

✅ Authentication routes created (`/api/auth/login`, `/api/auth/signup`)
✅ AuthContext updated to use API instead of localStorage
✅ JWT token authentication implemented
⚠️ Need to add `password_hash` column to database
⚠️ Need to deploy API server and set `VITE_API_URL`

## Quick Fix for Testing Locally

If you want to test locally first:

1. Start your API server:
   ```bash
   npm run api:dev
   ```

2. Create `.env` file in `PesoPlan/`:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. Test signup/login in different browsers - they should now share the same database!

