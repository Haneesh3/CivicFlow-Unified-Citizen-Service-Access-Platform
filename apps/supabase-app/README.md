# Supabase Fullstack App

A complete end-to-end web application using Supabase, Express, and React.

## Features
- Supabase Auth with email/password and social provider readiness
- Profile CRUD operations via Supabase tables
- Admin dashboard with role-based access control
- Data visualization using Chart.js
- REST API with validation and centralized error handling
- Docker-ready backend and local database support
- Swagger API docs and Supabase schema patterns

## Getting Started

### 1. Clone and install dependencies
```bash
cd apps/supabase-app/backend
npm install
cd ../frontend
npm install
```

### 2. Configure environment
Create `.env` files from the examples:
- `backend/.env`
- `frontend/.env`

Required keys:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

### 3. Run the backend
```bash
cd apps/supabase-app
docker-compose up --build
```

### 4. Run frontend locally
```bash
cd apps/supabase-app/frontend
npm run dev
```

### 5. Visit the app
- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:4000/api/docs`

## Supabase Schema
Create a table in Supabase for user profiles:
```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade,
  email text,
  full_name text,
  bio text,
  location text,
  role text default 'user',
  created_at timestamp with time zone default now(),
  primary key (id)
);
```

Enable RLS on `profiles` and add policies for owner access and admin read:
```sql
alter table profiles enable row level security;

create policy "Users can manage own profile"
  on profiles
  for all
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles
  for select
  using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');
```

## Testing
Run tests in the backend:
```bash
cd apps/supabase-app/backend
npm test
```

## Deployment
- Frontend: deploy to Vercel/Netlify
- Backend: deploy to Docker host or cloud service, with Supabase environment variables
- Database: Supabase managed PostgreSQL

## API Overview
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/profile`
- `PUT /api/profile`
- `DELETE /api/profile`
- `GET /api/admin/users`
- `GET /api/admin/stats`

## CivicFlow Innovation Placeholder
This application is prepared for a future CivicFlow communication layer integration by providing modular auth, profile, and admin service boundaries.
