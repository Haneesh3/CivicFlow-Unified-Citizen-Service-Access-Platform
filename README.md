# CivicFlow MVP

CivicFlow is a modern, mobile-first civic issue reporting and e-governance super-app designed for Indian municipalities and citizens. It features location-based issue routing, a government services catalog, and a powerful admin portal.

## Project Architecture
This project uses an npm workspaces monorepo structure:
- **`apps/api`**: NestJS backend providing RESTful APIs, utilizing Prisma with PostgreSQL and PostGIS for geospatial data.
- **`apps/web`**: Next.js 15 PWA frontend containing the Admin portal and a responsive web fallback for citizens.
- **`apps/mobile`**: React Native (Expo) mobile app tailored for citizens to report issues and access services.

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (with PostGIS if not using Docker)

## Local Setup

### 1. Database & Infrastructure
CivicFlow requires PostgreSQL with PostGIS for spatial queries and Redis for caching.
Start the infrastructure using Docker Compose:
```bash
docker-compose up -d
```

### 2. Install Dependencies
In the root directory of the monorepo, install dependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Backend Setup
Navigate to the `apps/api` directory:
```bash
cd apps/api
```
Create a `.env` file based on `.env.example` (or use the one automatically generated). Ensure `DATABASE_URL` is set to your running PostGIS instance.

Sync the database schema:
```bash
npx prisma db push
```

Start the backend API:
```bash
npm run start:dev
```

### 4. Web Frontend (Admin/PWA)
Navigate to `apps/web`:
```bash
cd apps/web
npm run dev
```
The web portal will be accessible at `http://localhost:3000`.

### 5. Mobile App (Expo)
Navigate to `apps/mobile`:
```bash
cd apps/mobile
npm run start
```
Use the Expo Go app on your physical device, or launch an iOS/Android simulator to view the app.

## Implementation Details
### Backend Modules
- **AuthModule**: Handles JWT generation, login, and registration.
- **UsersModule**: Manages citizen and staff profiles.
- **ComplaintsModule**: Handles the lifecycle of a complaint. Features PostGIS geospatial deduplication (within 50 meters) and radius searches.
- **ServicesModule**: Provides a catalog of external government services (e.g. Aadhaar, PAN) with deep links.

### Deployment Readiness
- **Database**: Use a managed PostgreSQL database with PostGIS extensions (e.g., AWS RDS PostgreSQL, Supabase).
- **Backend**: Can be containerized and deployed to AWS ECS, Google Cloud Run, or Vercel (via serverless functions).
- **Web App**: Deploy directly to Vercel or Netlify.
- **Mobile App**: Use EAS (Expo Application Services) to build standard `.apk`, `.aab`, and `.ipa` artifacts.

*This project was developed strictly adhering to the CivicFlow MVP PRD.*
