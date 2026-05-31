# Ahoum Sessions Marketplace - Project Report

## 1. Project Overview

Ahoum Sessions Marketplace is a full-stack microservices-based web application for discovering, creating, and booking wellness or learning sessions. The platform supports three major roles: users, creators, and admins.

Users can browse available sessions and book them. Creators can publish sessions, manage their session inventory, and view booking activity. Admins can manage users, sessions, and bookings across the platform.

The project is designed as a Dockerized multi-service system with a React frontend, Django backend services, PostgreSQL databases, Redis, and Nginx reverse proxy.

## 2. Objective

The main objective of this project is to build a scalable session marketplace where:

- Users can log in and book sessions.
- Creators can create, update, and delete sessions.
- Admins can control users, sessions, and bookings.
- Authentication is handled using Google OAuth and a local demo login mode.
- The system is easy to run locally using Docker Compose.

## 3. Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- JavaScript

### Backend

- Python
- Django
- Django REST Framework
- Gunicorn
- JWT authentication

### Database and Infrastructure

- PostgreSQL 16
- Redis 7
- Nginx
- Docker
- Docker Compose

## 4. Project Architecture

The application follows a microservices architecture.

```text
Browser
  |
  v
Nginx Reverse Proxy :8080
  |
  |-- /              -> React frontend
  |-- /api/auth/     -> auth-service
  |-- /api/sessions/ -> sessions-service
  |-- /api/bookings/ -> bookings-service
  |
  v
PostgreSQL + Redis
```

Each backend service has its own responsibility and its own database.

## 5. Main Services

### 5.1 Auth Service

Folder: `auth-service`

The auth service manages user authentication, profile data, roles, and admin user management.

Main features:

- Google OAuth login
- Local demo login
- JWT token generation
- User profile update
- Role management
- Admin user listing
- Admin user blocking/unblocking
- Admin user deletion

User roles:

- `user`
- `creator`
- `admin`

Main model:

- `Profile`

Important fields:

- `role`
- `avatar`
- `oauth_provider`
- `oauth_id`
- `is_blocked`

### 5.2 Sessions Service

Folder: `sessions-service`

The sessions service manages session listings created by creators.

Main features:

- Public session catalog
- Session search by title/category
- Creator session creation
- Creator-owned session listing
- Session update
- Session delete
- Admin session listing
- Active/inactive session status

Main model:

- `Session`

Important fields:

- `creator_id`
- `creator_name`
- `title`
- `description`
- `category`
- `starts_at`
- `duration_minutes`
- `price`
- `capacity`
- `image_url`
- `meeting_link`
- `is_active`

### 5.3 Bookings Service

Folder: `bookings-service`

The bookings service manages user bookings.

Main features:

- User session booking
- User booking history
- Active and past booking filtering
- Creator booking overview
- Admin booking listing
- Booking cancellation/restoration
- Admin booking deletion

Main model:

- `Booking`

Important fields:

- `user_id`
- `user_name`
- `user_email`
- `session_id`
- `session_title`
- `session_creator_id`
- `starts_at`
- `status`

Important rule:

- A user can book the same session only once.

## 6. Frontend Features

Folder: `frontend`

The frontend is a React single-page application built with Vite.

Main pages and views:

- Public catalog page
- Session detail page
- User dashboard
- Creator dashboard
- Admin dashboard

### User Dashboard

Features:

- Total bookings
- Active bookings
- Completed sessions
- Cancelled bookings
- Booking history
- Profile update
- Switch to creator role

### Creator Dashboard

Features:

- Total sessions
- Active sessions
- Total bookings
- Revenue analytics
- Create session
- Edit session
- Delete session
- View session bookings
- Profile update
- Switch to user role

### Admin Dashboard

Features:

- Total users
- Total creators
- Total sessions
- Total bookings
- Total revenue
- User search and filtering
- Change user roles
- Block/unblock users
- Delete users
- View, edit, activate, deactivate, and delete sessions
- View and manage all bookings

## 7. API Endpoints

All APIs are exposed through Nginx on:

```text
http://localhost:8080
```

### Auth APIs

Base path:

```text
/api/auth/
```

Endpoints:

- `GET /api/auth/google/url/`
- `POST /api/auth/google/callback/`
- `POST /api/auth/dev-login/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/`
- `GET /api/auth/admin/users/`
- `PATCH /api/auth/admin/users/`
- `DELETE /api/auth/admin/users/`

### Sessions APIs

Base path:

```text
/api/sessions/
```

Endpoints:

- `GET /api/sessions/`
- `POST /api/sessions/`
- `GET /api/sessions/mine/`
- `GET /api/sessions/admin/`
- `GET /api/sessions/:id/`
- `PATCH /api/sessions/:id/`
- `DELETE /api/sessions/:id/`

### Bookings APIs

Base path:

```text
/api/bookings/
```

Endpoints:

- `GET /api/bookings/`
- `POST /api/bookings/`
- `GET /api/bookings/creator/`
- `GET /api/bookings/admin/`
- `PATCH /api/bookings/:id/`
- `DELETE /api/bookings/:id/`

## 8. Database Design

The project uses PostgreSQL with separate databases for each service.

Databases:

- `auth_db`
- `sessions_db`
- `bookings_db`

The initialization file creates all three databases:

```sql
CREATE DATABASE auth_db OWNER ahoum;
CREATE DATABASE sessions_db OWNER ahoum;
CREATE DATABASE bookings_db OWNER ahoum;
```

This separation improves modularity and follows a microservices-style ownership model.

## 9. Authentication and Authorization

Authentication is based on JWT tokens.

Flow:

1. User logs in using Google OAuth or demo login.
2. Auth service generates a JWT token.
3. Frontend stores the auth payload in local storage.
4. Frontend sends the token using the `Authorization: Bearer <token>` header.
5. Backend services decode the JWT token and enforce role-based access.

Authorization rules:

- Only users can book sessions.
- Only creators and admins can create sessions.
- Creators can update/delete only their own sessions.
- Admins can manage all users, sessions, and bookings.

## 10. Docker Setup

The project is started using Docker Compose.

Services defined in `docker-compose.yml`:

- `postgres`
- `redis`
- `auth-service`
- `sessions-service`
- `bookings-service`
- `frontend`
- `nginx`

The backend services run migrations automatically before starting Gunicorn.

Example backend command:

```text
python manage.py migrate && gunicorn <service>.wsgi:application --bind 0.0.0.0:8000
```

Nginx exposes the complete application on port `8080`.

## 11. Environment Variables

The project uses `.env` for configuration.

Important variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `AUTH_DB_NAME`
- `SESSIONS_DB_NAME`
- `BOOKINGS_DB_NAME`
- `DJANGO_SECRET_KEY`
- `JWT_SECRET`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI`
- `ADMIN_EMAILS`
- `ENABLE_DEV_LOGIN`

For local testing, `ENABLE_DEV_LOGIN=1` allows demo login buttons to work.

## 12. How to Run the Project in VS Code

### Prerequisites

- VS Code
- Docker Desktop
- Docker Compose

### Steps

1. Open VS Code.
2. Open this folder:

```text
D:\Ahoum Company\fullstack
```

3. Open a new terminal in VS Code.

4. If `.env` does not exist, create it from the example file:

```powershell
Copy-Item .env.example .env
```

5. Start the project:

```powershell
docker compose up --build
```

6. Open the application:

```text
http://localhost:8080
```

7. To stop the project:

```powershell
Ctrl + C
docker compose down
```

8. To reset database data:

```powershell
docker compose down -v
```

## 13. Demo Testing Flow

For quick local testing:

1. Open `http://localhost:8080`.
2. Click `Demo Creator`.
3. Create a session.
4. Logout.
5. Click `Demo User`.
6. Open the session detail page.
7. Book the session.
8. Open dashboard and check booking.
9. Login again as creator and view booking overview.
10. Use admin login or admin-configured email to test admin dashboard.

## 14. Security Considerations

Current security features:

- JWT-based authentication
- Role-based authorization
- Admin-only user management
- Creator ownership checks for session updates/deletes
- Blocked user status
- CORS configuration
- Environment-based secrets

Production recommendations:

- Set `ENABLE_DEV_LOGIN=0`
- Use strong `DJANGO_SECRET_KEY`
- Use strong `JWT_SECRET`
- Restrict `ALLOWED_HOSTS`
- Restrict `CORS_ALLOWED_ORIGINS`
- Use HTTPS
- Store secrets securely
- Configure real Google OAuth credentials

## 15. Strengths of the Project

- Clean microservices architecture
- Separate databases per service
- Dockerized setup
- Role-based dashboards
- Admin management panel
- Demo login support for testing
- Google OAuth support
- JWT authentication shared across services
- Creator analytics and booking overview
- User-friendly React interface

## 16. Limitations

- Payment integration is not implemented.
- File upload is not implemented; sessions use image URLs.
- Booking capacity is displayed but not strictly enforced in the booking service.
- Email notifications are not implemented.
- Automated test coverage is not included.
- Production deployment configuration is not fully included.

## 17. Future Scope

Possible improvements:

- Stripe or Razorpay payment integration
- Email notifications for booking confirmation
- Session reminder emails
- Real file/image upload using S3 or MinIO
- Redis-backed rate limiting
- Automated backend and frontend tests
- Capacity enforcement during booking
- Review and rating system
- Creator payout dashboard
- Deployment on cloud platforms
- Better observability and logging

## 18. Conclusion

Ahoum Sessions Marketplace is a well-structured full-stack application built with a microservices approach. It provides core marketplace functionality such as authentication, session creation, booking management, and admin control.

The use of Docker Compose makes the project easy to run locally, while the separation of auth, sessions, and bookings services makes the system modular and easier to scale. With additional features like payment integration, file upload, notifications, and test coverage, the project can be extended into a production-ready marketplace platform.
