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

## Environment
- `JWT_SECRET`: shared JWT secret (defaults to `change-me-please`)
- Postgres: `umrah / umrah` on `localhost:5432`
