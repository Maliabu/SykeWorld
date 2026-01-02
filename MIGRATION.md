# Django to Next.js Serverless Migration Guide

This document outlines the migration from Django backend to Next.js serverless with Drizzle ORM, Zod validation, and Server Actions.

## Architecture Overview

- **Database**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM
- **Validation**: Zod schemas
- **Authentication**: JWT with httpOnly cookies
- **API**: Next.js Server Actions (App Router)

## Setup Instructions

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Environment Variables

Create a `.env` (or `.env.local`) file in the `web` directory:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id
PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
```

### 3. Database Setup

Generate migrations:

```bash
npm run db:generate
```

Push schema to database:

```bash
npm run db:push
```

Or run migrations:

```bash
npm run db:migrate
```

### 4. Database Schema

The schema is organized in `lib/db/schema/`:
- `users.ts` - User accounts and contact messages
- `bookings.ts` - Rooms, bookings, reviews, gallery
- `payments.ts` - Payments and transactions
- `staff.ts` - Staff profiles, roles, tasks

## Server Actions

All server actions are in `lib/actions/`:

### Authentication (`lib/actions/auth.ts`)
- `registerGuest(data)` - Register a guest user
- `registerStaff(data)` - Register a staff user
- `login(data)` - Login user
- `googleLogin(data)` - Google OAuth login
- `logout()` - Logout user
- `whoami()` - Get current user

### Bookings (`lib/actions/bookings.ts`)
- `getAllRooms()` - Get all rooms with images and services
- `getRoomById(roomId)` - Get single room details
- `getAllServices()` - Get all room services
- `createRoomType(data)` - Create room type (staff only)
- `createRoom(data)` - Create room (staff only)
- `createBooking(data)` - Create booking
- `getUserBookings()` - Get user's bookings
- `checkAvailability(data)` - Check room availability
- `createReview(data)` - Create room review
- `getRoomReviews(roomId)` - Get room reviews
- `subscribe(data)` - Subscribe to newsletter
- `getAllGalleryCategories()` - Get gallery categories
- `getGalleryImages(categoryId?)` - Get gallery images

### Payments (`lib/actions/payments.ts`)
- `createPayment(data)` - Create payment
- `createTransaction(data)` - Create transaction
- `getUserPayments()` - Get user payments
- `getUserTransactions()` - Get user transactions
- `updatePaymentStatus(paymentId, status, message?)` - Update payment status
- `updateTransactionStatus(transactionId, status)` - Update transaction status

### Staff (`lib/actions/staff.ts`)
- `createRole(data)` - Create role (staff only)
- `createStaff(data)` - Create staff profile (staff only)
- `getAllStaff()` - Get all staff (staff only)
- `createTask(data)` - Create task (staff only)
- `getAllTasks()` - Get all tasks (staff only)
- `getAllRoles()` - Get all roles (staff only)
- `getAllTaskStatuses()` - Get all task statuses (staff only)

### Contact (`lib/actions/contact.ts`)
- `createContactMessage(data)` - Create contact message

## Validation Schemas

Zod schemas are in `lib/validations/`:
- `auth.ts` - Authentication schemas
- `bookings.ts` - Booking-related schemas
- `payments.ts` - Payment schemas
- `staff.ts` - Staff management schemas

## Authentication

Authentication uses JWT tokens stored in httpOnly cookies:
- `access` cookie - 30 minutes expiration
- `refresh` cookie - 7 days expiration

### Session Management

Use `getSession()` from `lib/auth/session.ts` to get current user:

```typescript
import { getSession } from "@/lib/auth/session";

const session = await getSession();
if (!session) {
  // User not authenticated
}
```

### Protected Actions

Use `requireAuth()` or `requireStaff()` in server actions:

```typescript
import { requireAuth, requireStaff } from "@/lib/auth/session";

// Require any authenticated user
const session = await requireAuth();

// Require staff user
const staffSession = await requireStaff();
```

## Usage Example

### Client Component

```typescript
"use client";

import { registerGuest } from "@/lib/actions/auth";

export default function RegisterForm() {
  async function handleSubmit(formData: FormData) {
    const result = await registerGuest({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    });

    if (result.error) {
      console.error(result.error);
    } else {
      console.log("Success:", result.user);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Server Component

```typescript
import { getAllRooms } from "@/lib/actions/bookings";

export default async function RoomsPage() {
  const result = await getAllRooms();

  if (result.error) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <div>
      {result.rooms?.map((room) => (
        <div key={room.id}>{room.roomNumber}</div>
      ))}
    </div>
  );
}
```

## Migration Notes

1. **Database**: Migrate from SQLite to Neon Postgres
2. **File Uploads**: Store file paths/URLs instead of FileField
3. **Authentication**: JWT replaces Django sessions
4. **API Routes**: Server Actions replace Django REST Framework views
5. **Validation**: Zod replaces Django forms/serializers
6. **ORM**: Drizzle replaces Django ORM

## Next Steps

1. Set up Neon database and configure `DATABASE_URL`
2. Run database migrations
3. Update frontend components to use server actions
4. Test all endpoints
5. Deploy to production




