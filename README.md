# Al-Muhammad Travels ? Umrah Service Portal

A microservices-based Umrah service portal with an ecommerce-style service flow.

## Stack
- Backend: Java 17, Spring Boot, Spring Cloud (Gateway)
- Frontend: React + Vite
- Services: auth, catalog, booking, payment
- Database: PostgreSQL

## Default Users
- Admin: `admin@almuhammad.com` / `admin123`
- User: `user@almuhammad.com` / `user123`

## Quick Start (Dev)
1. Start Postgres (Docker):
   - `docker compose up -d postgres`
2. Start backend services (each in its own terminal):
   - `cd services/auth` then `./mvnw spring-boot:run`
   - `cd services/catalog` then `./mvnw spring-boot:run`
   - `cd services/booking` then `./mvnw spring-boot:run`
   - `cd services/payment` then `./mvnw spring-boot:run`
   - `cd services/gateway` then `./mvnw spring-boot:run`
3. Start frontend:
   - `cd frontend` then `npm install` and `npm run dev`

## Ports
- Gateway: 8080
- Auth: 8081
- Catalog: 8082
- Booking: 8083
- Payment: 8084
- Frontend: 5173

## Routes (via Gateway)
- `/api/auth/**`
- `/api/catalog/**`
- `/api/booking/**`
- `/api/payment/**`
- `/api/admin/catalog/**`
- `/api/admin/booking/**`
- `/api/admin/payment/**`

## Multi-Tenant Behavior
- Every request can include `X-Tenant-ID` (defaults to `public` if missing).
- JWT tokens now carry a tenant claim; gateway enforces tenant match for protected routes.
- Data is scoped by tenant in `auth`, `booking`, `payment`, and tenant-aware views in `catalog`.
- New profile endpoint:
  - `GET /api/auth/me` (requires bearer token)

## Registration Flow (Email + Mobile OTP)
1. Request OTP: `POST /api/auth/otp/request` with `mobileNumber` (E.164 format, e.g. `+919876543210`)
2. Verify OTP: `POST /api/auth/otp/verify` with `mobileNumber` and `otp`
3. Register: `POST /api/auth/register` with:
   - `firstName`
   - `lastName`
   - `email`
   - `mobileNumber`
   - `mobileVerificationToken` (from OTP verify response)
   - `password`

Note: in local dev, OTP is returned in response as `demoOtp` by default.

## Environment
- `JWT_SECRET`: shared JWT secret (use 32+ chars; compose now sets a valid dev default)
- Postgres: `umrah / umrah` on `localhost:5432`

## Google Sign-In Setup
1. Create a Google OAuth Web Client in Google Cloud Console.
2. Add your frontend origin (for local Docker dev: `http://localhost:5173`).
3. Set environment variable `GOOGLE_CLIENT_ID` before starting compose.
   - PowerShell example: `$env:GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"`
4. Restart services: `docker compose up -d --build`

The frontend reads `VITE_GOOGLE_CLIENT_ID` from compose, and auth service validates Google ID tokens using `GOOGLE_CLIENT_ID`.

## Razorpay Setup (UPI/Card)
1. Create/Use a Razorpay key pair.
2. Set environment variables before starting compose:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Start services:
   - `docker compose up -d --build payment frontend`

Installment payment buttons now support:
- `UPI`
- `Credit Card`
- `Debit Card`
