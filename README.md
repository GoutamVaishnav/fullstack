# Ahoum Sessions Marketplace

Microservices implementation of the Full-Stack Developer Intern assignment.

## Architecture

```text
Browser
  |
  v
Nginx reverse proxy :8080
  |-- /              -> React frontend
  |-- /api/auth/     -> Django auth-service
  |-- /api/sessions/ -> Django sessions-service
  |-- /api/bookings/ -> Django bookings-service
  |
  v
PostgreSQL container with one database per service
```

Services:

- `auth-service`: Google OAuth, local demo login, JWT issuing, profile and role updates.
- `sessions-service`: public catalog plus creator-owned session CRUD.
- `bookings-service`: user bookings and creator booking overview. It calls `sessions-service` before booking.
- `frontend`: React client-side app.
- `nginx`: reverse proxy and single public entry point.

## Prerequisites

- Docker Desktop
- Google OAuth Client credentials for real OAuth login

## Setup

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Update `.env`:

   ```env
   POSTGRES_DB=ahoum_marketplace
   POSTGRES_USER=ahoum
   POSTGRES_PASSWORD=change_me
   AUTH_DB_NAME=auth_db
   SESSIONS_DB_NAME=sessions_db
   BOOKINGS_DB_NAME=bookings_db
   DJANGO_SECRET_KEY=use_a_long_random_string
   JWT_SECRET=use_another_long_random_string
   DEBUG=1
   ALLOWED_HOSTS=*
   CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
   ENABLE_DEV_LOGIN=1
   ```

3. Start the system:

   ```bash
   docker compose up --build
   ```

4. Open the app:

   [http://localhost:8080](http://localhost:8080)

## Google OAuth Setup

1. Go to Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID with application type `Web application`.
5. Add this authorized JavaScript origin:

   ```text
   http://localhost:8080
   ```

6. Add this authorized redirect URI:

   ```text
   http://localhost:8080/auth/callback
   ```

7. Copy the Client ID and Client Secret into `.env`.

## Demo Flow

You can use Google login after OAuth setup. For quick local testing, use the demo buttons on the home page.

1. Click `Demo Creator`.
2. Open `Creator`.
3. Create a session with title, description, start time, duration, price, and optional image URL.
4. Logout.
5. Click `Demo User`.
6. Open the catalog, view the session detail, and click `Book Now`.
7. Open `Dashboard` to see active and past bookings.
8. Login again as creator to see the booking overview.

## API Summary

Auth:

- `GET /api/auth/google/url/`
- `POST /api/auth/google/callback/`
- `POST /api/auth/dev-login/`
- `GET/PATCH /api/auth/me/`

Sessions:

- `GET/POST /api/sessions/`
- `GET /api/sessions/mine/`
- `GET/PATCH/DELETE /api/sessions/:id/`

Bookings:

- `GET/POST /api/bookings/`
- `GET /api/bookings/creator/`
- `PATCH /api/bookings/:id/`

## Production Notes

- Set `ENABLE_DEV_LOGIN=0`.
- Use strong unique secrets for `DJANGO_SECRET_KEY` and `JWT_SECRET`.
- Restrict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- The compose setup already uses separate databases for each service inside one PostgreSQL container.
- Optional bonus work: Stripe/Razorpay payments, MinIO uploads, Redis-backed rate limiting.
