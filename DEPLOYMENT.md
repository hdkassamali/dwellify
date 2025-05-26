# Dwellify Deployment Guide

This guide explains how to deploy the Dwellify application:
- Frontend: Vercel
- Backend: Render
- Database: Supabase

## 1. Database Setup (Supabase)

### Create a PostgreSQL Database on Supabase

1. Sign up or log in at [Supabase](https://supabase.com)
2. Create a new project
3. Choose a database password and save it securely
4. Wait for your database to be provisioned (1-2 minutes)

### Get Database Credentials

1. Go to **Project Settings** → **Database**
2. In the **Connection Info** section, find:
   - Host: `db.[project-ref].supabase.co` (note the "db." prefix)
   - Database name: `postgres`
   - Port: `5432`
   - User: `postgres` 
   - Password: (the one you created)
3. Save these details for configuring your backend

### Configure Transaction Pooler for Render Compatibility

Render requires IPv4 compatibility, but the default Supabase direct connection uses IPv6. To fix this:

1. In your Supabase dashboard, go to **Project Settings** → **Database**
2. In the **Connection Pooling** section, find the **Transaction pooler** information:
   - Host: `aws-0-[region].pooler.supabase.com` 
   - Port: `6543` (note this is different from the direct connection port)
   - User: `postgres.[project-ref]`
   - Database: `postgres`
   - Pool Mode: `transaction`

3. You'll need these details when configuring your Render environment variables

### Setup Database Schema

You have several options for setting up your database schema:

#### Option 1: Use Entity Synchronization (Recommended)

This is the simplest and most reliable approach:

1. Temporarily modify `ormconfig.js` to enable schema synchronization:
   ```javascript
   // In ormconfig.js, modify the production config:
   production: {
     // ...other settings
     synchronize: true,  // Change to true temporarily
     // ...
   }
   ```

2. Create a `.env` file in your backend directory with your Supabase credentials:
   ```
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-actual-password
   DB_DATABASE=postgres
   NODE_ENV=production
   ```

3. Run the application once to generate the schema:
   ```bash
   cd back-end
   NODE_ENV=production node app.js
   ```

4. After a few seconds (once you see it's running), stop the application with Ctrl+C

5. Run the seed script to populate your database (if needed):
   ```bash
   cd back-end
   NODE_ENV=production npm run seed
   ```

6. Set `synchronize` back to `false` in `ormconfig.js` to prevent accidental schema changes:
   ```javascript
   production: {
     // ...other settings
     synchronize: false,  // Change back to false for safety
     // ...
   }
   ```
7. You can check your that your database is populated with the tables and seed data by navigating to your supabase projectdatabase and checking the table editor.
   
8. After database setup, you can revert to local development settings:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=password
   DB_DATABASE=tenant_portal
   NODE_ENV=development
   ```

#### Option 2: Run TypeORM Migrations

If you prefer using migrations:

1. Create a `.env` file in your backend directory with your Supabase credentials:
   ```
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-actual-password
   DB_DATABASE=postgres
   NODE_ENV=production
   ```

2. Run the migrations command from your backend directory:
   ```bash
   cd back-end
   npm run migration:run
   ```
   
   This will create tables and relationships based on your migration files.

#### Option 3: Manual SQL Script

If the other options don't work:

1. Go to the **SQL Editor** in your Supabase dashboard
2. Create your tables based on your existing schema
   - You can export your schema from your local database using:
     ```bash
     pg_dump -U postgres -h localhost -p 5432 -d tenant_portal --schema-only > schema.sql
     ```
   - Then copy and paste the contents of schema.sql into the SQL Editor

## 2. Backend Deployment (Render)

### Deploy to Render

1. Sign up or log in at [Render](https://render.com)
2. Click **New** and select **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `dwellify-backend`
   - **Root Directory**: `back-end` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Set environment variables:
   - `DB_HOST`: Your Supabase Transaction pooler host (e.g., `aws-0-us-west-1.pooler.supabase.com`)
   - `DB_PORT`: `6543` (Transaction pooler port)
   - `DB_USERNAME`: Your Supabase Transaction pooler username (e.g., `postgres.[project-ref]`)
   - `DB_PASSWORD`: Your Supabase password
   - `DB_DATABASE`: `postgres`
   - `NODE_ENV`: `production`
   - `SESSION_SECRET_KEY`: A secure random string (Can use render to generate a random string for you)
   - `CORS_ORIGIN_BASE`: Your frontend URL (will be your Vercel URL)
   - `POOL_MODE`: `transaction`

6. Click **Deploy Web Service**

> **Important**: Using the Transaction pooler is critical for compatibility with Render, which requires IPv4 connections. The default direct Supabase connection will fail with IPv6 ENETUNREACH errors.

### Configuring Session Storage

For proper session persistence in production, the application uses PostgreSQL to store session data. This is already configured in the code and should work automatically if you've set up the database connection correctly.

The session configuration uses the following:

1. The `connect-pg-simple` package to store sessions in PostgreSQL
2. Automatic table creation with the `createTableIfMissing: true` option
3. Session cookies configured for cross-origin use with `sameSite: 'none'` in production

If you encounter session-related issues (like being logged out unexpectedly), check that:
- Your `SESSION_SECRET_KEY` environment variable is properly set
- The PostgreSQL connection is working correctly
- Cross-Origin Resource Sharing (CORS) is configured to allow your frontend domain

## 3. Frontend Deployment (Vercel)

### Prepare Your Frontend Code

Your frontend is already configured with environment files:

1. `.env.local` - Used for local development:
   ```
   VITE_API_BASE_URL=http://localhost:4000
   ```

2. `.env.production` - Used for production deployment:
   ```
   VITE_API_BASE_URL=https://dwellify-backend.onrender.com
   ```

Make sure your `.env.production` file has the correct Render backend URL. Update it if needed before deploying to Vercel.

### Deploy to Vercel

1. Sign up or log in at [Vercel](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Select `Vite` or other if detected
   - **Root Directory**: `front-end` (important!)
   - **Build Command**: `npm run build` (usually default)
   - **Output Directory**: `dist` (usually default for Vite)

5. Vercel will automatically use your `.env.production` file values, but you can also set environment variables in the Vercel dashboard if needed.
   
6. Click **Deploy**

## 4. Connect Everything

1. After your frontend is deployed, get the Vercel URL
2. Go to your Render dashboard for the backend service
3. Update the `CORS_ORIGIN_BASE` environment variable to your Vercel URL
4. Restart your backend service for the changes to take effect

## Local Development After Deployment Setup

For local development after deployment:

1. No changes needed! Your app will automatically use local database in development mode.
2. Just make sure you have a `.env` file in your backend folder with:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=password
   DB_DATABASE=tenant_portal
   NODE_ENV=development
   SESSION_SECRET_KEY=local_dev_secret_key
   CORS_ORIGIN_BASE=http://localhost:5173
   ```

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials are correct
- Check if IP allow list in Supabase needs to include Render's IPs
- Make sure to use the full hostname with the "db." prefix

### CORS Issues
- Ensure `CORS_ORIGIN_BASE` is set correctly in your backend
- Check that frontend requests include credentials if needed

### Authentication Problems
- Verify your session configuration works with the new deployment setup
- Check if cookies are being set/sent correctly

### Render Sleeping
- Free tier Render services sleep after inactivity
- Consider upgrading or using a service to ping your backend periodically 