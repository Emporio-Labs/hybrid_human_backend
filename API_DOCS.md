# HybridHuman Backend API Documentation

**Base URL:** `http://localhost:3000`  
**API Version:** 1.0.0  
**Last Updated:** March 27, 2026

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Endpoints Overview](#endpoints-overview)
3. [Auth Routes](#auth-routes)
4. [Admin Routes](#admin-routes)
5. [User Routes](#user-routes)
6. [Doctor Routes](#doctor-routes)
7. [Trainer Routes](#trainer-routes)
8. [Slot Routes](#slot-routes)
9. [Membership Routes](#membership-routes)
10. [Service Routes](#service-routes)
11. [Therapy Routes](#therapy-routes)
12. [Lead Routes](#lead-routes)
13. [Booking Routes](#booking-routes)
14. [Appointment Routes](#appointment-routes)
15. [Schedule Routes](#schedule-routes)
16. [Enums & Status Codes](#enums--status-codes)
17. [Error Handling](#error-handling)

---

## Authentication

### Basic Authentication

All protected endpoints use **HTTP Basic Authentication** with the following format:

```
Authorization: Basic <base64(email:password)>
```

**Example:**
```bash
# Credentials: user@example.com:mypassword
# Base64 encoded: dXNlckBleGFtcGxlLmNvbTpteXBhc3N3b3Jk

curl -H "Authorization: Basic dXNlckBleGFtcGxlLmNvbTpteXBhc3N3b3Jk" \
  http://localhost:3000/doctors
```

### User Roles

The system supports 4 role types:
- **`user`** — Patient/end-user (non-medical)
- **`doctor`** — Healthcare provider
- **`trainer`** — Fitness/wellness trainer
- **`admin`** — Front desk/system administrator

---

## Endpoints Overview

| Route | Purpose | Auth | Endpoints |
|-------|---------|------|-----------|
| `/auth` | User authentication | ❌ No | 2 endpoints |
| `/admins` | Admin management | ✅ Admin only | 5 endpoints |
| `/users` | Member management | ✅ Admin + Doctor (read), Admin (write), User self-onboard | 6 endpoints |
| `/doctors` | Doctor management | ✅ Admin + Role-based | 5 endpoints |
| `/trainers` | Trainer management | ✅ Admin + Role-based | 5 endpoints |
| `/slots` | Time slot management | ✅ Admin only | 5 endpoints |
| `/memberships` | Membership plans per user | ✅ Mixed roles | 6 endpoints |
| `/services` | Catalog of services | ✅ Mixed roles | 5 endpoints |
| `/therapies` | Catalog of therapies | ✅ Mixed roles | 5 endpoints |
| `/leads` | Lead intake and conversion | ✅ Mixed roles | 6 endpoints |
| `/bookings` | Service bookings | ✅ Mixed roles | 7 endpoints |
| `/appointments` | Doctor appointments | ✅ Mixed roles | 7 endpoints |
| `/schedules` | User schedules/todos | ✅ All authenticated | 6 endpoints |
| `/health` | Health check | ❌ No | 1 endpoint |

**Total Endpoints:** 71

---

## Auth Routes

### Base Path: `/auth`

#### 1. User Signup
```
POST /auth/signup
```

**Authentication:** ❌ None  
**Authorization:** N/A

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123",
  "age": 28,
  "gender": 0,
  "healthGoals": "Build muscle and lose weight"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011",
  "onboarded": false
}
```

**Error Responses:**
- `400` — Missing or invalid fields
- `409` — Email already exists

---

#### 2. Unified Login (User/Admin/Doctor/Trainer)
```
POST /auth/login
```

**Authentication:** ❌ None  
**Authorization:** N/A

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Admin Login Response Example (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439099",
    "email": "admin@hybridhuman.com",
    "role": "admin"
  }
}
```

**Doctor Login Response Example (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439055",
    "email": "dr.jane@hybridhuman.com",
    "role": "doctor"
  }
}
```

**Trainer Login Response Example (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439077",
    "email": "coach.mike@hybridhuman.com",
    "role": "trainer"
  }
}
```

**Error Responses:**
- `400` — Invalid login payload
- `401` — Invalid email or password

---

## Admin Routes

### Base Path: `/admins`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin role required for create/update/delete
- ✅ Admin or Doctor role allowed for read (list and get by id)

#### 1. Create Admin
```
POST /admins
```

**Request Body:**
```json
{
  "adminName": "Alice Manager",
  "email": "alice@hybridhuman.com",
  "phone": "+1234567890",
  "password": "adminPass123"
}
```

**Response (201 Created):**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "_id": "507f1f77bcf86cd799439011",
    "adminName": "Alice Manager",
    "email": "alice@hybridhuman.com",
    "phone": "+1234567890",
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 2. Get All Admins
```
GET /admins
```

**Response (200 OK):**
```json
{
  "admins": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "adminName": "Alice Manager",
      "email": "alice@hybridhuman.com",
      "phone": "+1234567890",
      "createdAt": "2026-03-20T10:00:00Z",
      "updatedAt": "2026-03-20T10:00:00Z"
    }
  ]
}
```

---

#### 3. Get Admin by ID
```
GET /admins/:id
```

**URL Params:**
- `id` (string, required) — Admin MongoDB ObjectId

**Response (200 OK):**
```json
{
  "admin": {
    "_id": "507f1f77bcf86cd799439011",
    "adminName": "Alice Manager",
    "email": "alice@hybridhuman.com",
    "phone": "+1234567890",
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 4. Update Admin
```
PATCH /admins/:id
```

**URL Params:**
- `id` (string, required) — Admin MongoDB ObjectId

**Request Body (all fields optional):**
```json
{
  "adminName": "Alice Manager Updated",
  "email": "alice.new@hybridhuman.com",
  "phone": "+9876543210",
  "password": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Admin updated successfully",
  "admin": { /* updated admin object */ }
}
```

---

#### 5. Delete Admin
```
DELETE /admins/:id
```

**URL Params:**
- `id` (string, required) — Admin MongoDB ObjectId

**Response (200 OK):**
```json
{
  "message": "Admin deleted successfully"
}
```

---

## User Routes

### Base Path: `/users`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin role for create/update/delete (except onboarding)
- ✅ Users can onboard themselves; admins can onboard any user

#### 1. Create User
```
POST /users
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123",
  "age": "28",
  "gender": "Male",
  "healthGoals": ["Build muscle", "Improve stamina"]
}
```

**Response (201 Created):**
```json
{
  "message": "User created",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "age": "28",
    "gender": "Male",
    "healthGoals": ["Build muscle", "Improve stamina"],
    "onboarded": false,
    "createdAt": "2026-03-21T10:00:00Z",
    "updatedAt": "2026-03-21T10:00:00Z"
  }
}
```

---

#### 2. Get All Users
```
GET /users
```

**Auth:** Admin or Doctor

**Response (200 OK):**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "age": "28",
      "gender": "Male",
      "healthGoals": ["Build muscle", "Improve stamina"],
      "createdAt": "2026-03-21T10:00:00Z",
      "updatedAt": "2026-03-21T10:00:00Z"
    }
  ]
}
```

---

#### 3. Get User by ID
```
GET /users/:id
```

**URL Params:**
- `id` (string, required) — User MongoDB ObjectId

**Auth:** Admin or Doctor

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "age": "28",
    "gender": "Male",
    "healthGoals": ["Build muscle", "Improve stamina"],
    "onboarded": false,
    "createdAt": "2026-03-21T10:00:00Z",
    "updatedAt": "2026-03-21T10:00:00Z"
  }
}
```

---

#### 4. Update User
```
PATCH /users/:id
```

**URL Params:**
- `id` (string, required) — User MongoDB ObjectId

**Request Body (all fields optional):**
```json
{
  "username": "john_updated",
  "phone": "+1987654321",
  "healthGoals": ["Weight loss", "Sleep improvement"],
  "onboarded": true
}
```

**Response (200 OK):**
```json
{
  "message": "User updated",
  "user": { /* updated user object */ }
}
```

---

#### 5. Onboard User (self or admin)
```
PATCH /users/:id/onboard
```

**Authorization:** Admin (any user) or User (self)

**Purpose:** Mark the user as onboarded and optionally update profile fields in one call.

**URL Params:**
- `id` (string, required) — User MongoDB ObjectId

**Request Body (all fields optional; at least one required):**
```json
{
  "username": "john_doe",
  "phone": "+1234567890",
  "age": "28",
  "gender": "Male",
  "healthGoals": ["Build muscle"],
  "onboarded": true
}
```

**Response (200 OK):**
```json
{
  "message": "User onboarded",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "age": "28",
    "gender": "Male",
    "healthGoals": ["Build muscle"],
    "onboarded": true,
    "createdAt": "2026-03-21T10:00:00Z",
    "updatedAt": "2026-03-21T10:05:00Z"
  }
}
```

**Notes:**
- Users can only onboard themselves; admins can onboard any user.
- The endpoint forces `onboarded` to `true` even if omitted.

---

#### 6. Delete User
```
DELETE /users/:id
```

**URL Params:**
- `id` (string, required) — User MongoDB ObjectId

**Response (200 OK):**
```json
{
  "message": "User deleted"
}
```

---

## Doctor Routes

### Base Path: `/doctors`

**Global Requirements:**
- ✅ Basic Authentication required for all endpoints

| Endpoint | POST | GET | PATCH | DELETE |
|----------|------|-----|-------|--------|
| `/doctors` | Admin | Admin | - | - |
| `/doctors/:id` | - | Doctor, Trainer | Doctor, Trainer | Admin |

#### 1. Create Doctor
```
POST /doctors
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "doctorName": "Dr. Smith",
  "email": "smith@hybridhuman.com",
  "phone": "+1234567890",
  "password": "docPass123",
  "description": "Cardiologist with 10+ years experience",
  "specialities": ["Cardiology", "Preventive Medicine"]
}
```

**Response (201 Created):**
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "_id": "507f1f77bcf86cd799439012",
    "doctorName": "Dr. Smith",
    "email": "smith@hybridhuman.com",
    "phone": "+1234567890",
    "description": "Cardiologist with 10+ years experience",
    "specialities": ["Cardiology", "Preventive Medicine"],
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 2. Get All Doctors
```
GET /doctors
```

**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "doctors": [ /* array of doctor objects */ ]
}
```

---

#### 3. Get Doctor by ID
```
GET /doctors/:id
```

**Authorization:** Doctor, Trainer

**URL Params:**
- `id` (string, required) — Doctor MongoDB ObjectId

**Response (200 OK):**
```json
{
  "doctor": { /* doctor object */ }
}
```

---

#### 4. Update Doctor
```
PATCH /doctors/:id
```

**Authorization:** Doctor, Trainer

**URL Params:**
- `id` (string, required) — Doctor MongoDB ObjectId

**Request Body (all fields optional):**
```json
{
  "doctorName": "Dr. Smith Updated",
  "description": "Cardiologist with 15+ years experience",
  "specialities": ["Cardiology", "Preventive Medicine", "Pediatric Cardiology"]
}
```

**Response (200 OK):**
```json
{
  "message": "Doctor updated successfully",
  "doctor": { /* updated doctor object */ }
}
```

---

#### 5. Delete Doctor
```
DELETE /doctors/:id
```

**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Doctor deleted successfully"
}
```

---

## Trainer Routes

### Base Path: `/trainers`

**Global Requirements:**
- ✅ Basic Authentication required for all endpoints
- Similar structure to Doctor routes

| Endpoint | POST | GET | PATCH | DELETE |
|----------|------|-----|-------|--------|
| `/trainers` | Admin | Admin | - | - |
| `/trainers/:id` | - | Trainer, Doctor | Trainer, Doctor | Admin |

#### 1. Create Trainer
```
POST /trainers
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "trainerName": "Coach John",
  "email": "john@hybridhuman.com",
  "phone": "+1234567890",
  "password": "trainerPass123",
  "description": "Fitness trainer specializing in HIIT",
  "specialities": ["HIIT", "Strength Training", "Yoga"]
}
```

**Response (201 Created):** Similar to Doctor creation

---

#### 2. Get All Trainers
```
GET /trainers
```

**Authorization:** Admin only

---

#### 3. Get Trainer by ID
```
GET /trainers/:id
```

**Authorization:** Trainer, Doctor

---

#### 4. Update Trainer
```
PATCH /trainers/:id
```

**Authorization:** Trainer, Doctor

---

#### 5. Delete Trainer
```
DELETE /trainers/:id
```

**Authorization:** Admin only

---

## Slot Routes

### Base Path: `/slots`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin role required for all endpoints

#### 1. Create Slot
```
POST /slots
```

**Request Body:**
```json
{
  "date": "2026-03-25T00:00:00Z",
  "startTime": "09:00",
  "endTime": "10:00",
  "isBooked": false
}
```

**Response (201 Created):**
```json
{
  "message": "Slot created successfully",
  "slot": {
    "_id": "507f1f77bcf86cd799439020",
    "date": "2026-03-25T00:00:00Z",
    "startTime": "09:00",
    "endTime": "10:00",
    "isBooked": false,
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 2. Get All Slots
```
GET /slots
```

**Response (200 OK):**
```json
{
  "slots": [ /* array of slot objects */ ]
}
```

---

#### 3. Get Slot by ID
```
GET /slots/:id
```

---

#### 4. Update Slot
```
PATCH /slots/:id
```

**Request Body (all fields optional):**
```json
{
  "date": "2026-03-26T00:00:00Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "isBooked": true
}
```

---

#### 5. Delete Slot
```
DELETE /slots/:id
```

---

## Membership Routes

### Base Path: `/memberships`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Role-based: `admin` for admin endpoints; users can only view their memberships

**Membership Status Values:** `Active`, `Paused`, `Cancelled`, `Expired`

#### 1. Create Membership (Admin)
```
POST /memberships
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "planName": "Gold Plan",
  "price": 49.99,
  "currency": "USD",
  "status": "Active",
  "startDate": "2026-04-01",
  "endDate": "2026-07-01",
  "features": ["unlimited-sessions", "priority-support"],
  "notes": "Spring promo"
}
```

**Responses:**
- `201` — Created; returns membership
- `400` — Invalid payload, invalid dates, or missing `userId`
- `401` — Unauthorized

#### 2. Get All Memberships (Admin)
```
GET /memberships
```

**Authorization:** Admin

**Responses:**
- `200` — `{ memberships: [...] }`
- `401` / `403` — Unauthorized / Forbidden

#### 3. Get My Memberships (User)
```
GET /memberships/me
```

**Authorization:** User

**Responses:**
- `200` — Memberships for the authenticated user
- `403` — If role is not `user`

#### 4. Get Membership by ID (Admin)
```
GET /memberships/:id
```

**Authorization:** Admin

**Responses:**
- `200` — Returns membership
- `400` — Invalid id
- `404` — Not found

#### 5. Update Membership (Admin)
```
PATCH /memberships/:id
```

**Authorization:** Admin

**Request Body:** Any subset of fields from create payload; at least one field required.

**Responses:**
- `200` — Updated membership
- `400` — Invalid payload/ids/dates
- `404` — Not found

#### 6. Delete Membership (Admin)
```
DELETE /memberships/:id
```

**Authorization:** Admin

**Responses:**
- `200` — Deleted
- `400` — Invalid id
- `404` — Not found

---

## Service Routes

### Base Path: `/services`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin creates/updates/deletes; all roles can read

#### 1. Create Service
```
POST /services
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "serviceName": "Body Composition Analysis",
  "serviceTime": 45,
  "description": "Includes BMI, body fat %, muscle mass",
  "tags": ["assessment", "baseline"],
  "slots": ["507f1f77bcf86cd799439020"]
}
```

#### 2. Get All Services
```
GET /services
```

**Authorization:** Admin, Doctor, Trainer, User

#### 3. Get Service by ID
```
GET /services/:id
```

**Authorization:** Admin, Doctor, Trainer, User

#### 4. Update Service
```
PATCH /services/:id
```

**Authorization:** Admin only

**Notes:** Any subset of fields from create payload; at least one field required.

#### 5. Delete Service
```
DELETE /services/:id
```

**Authorization:** Admin only

---

## Therapy Routes

### Base Path: `/therapies`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin creates/updates/deletes; all roles can read

#### 1. Create Therapy
```
POST /therapies
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "therapyName": "Deep Tissue Massage",
  "therapyTime": 60,
  "description": "Focus on muscle recovery",
  "tags": ["recovery", "massage"],
  "slots": ["507f1f77bcf86cd799439020"]
}
```

#### 2. Get All Therapies
```
GET /therapies
```

**Authorization:** Admin, Doctor, Trainer, User

#### 3. Get Therapy by ID
```
GET /therapies/:id
```

**Authorization:** Admin, Doctor, Trainer, User

#### 4. Update Therapy
```
PATCH /therapies/:id
```

**Authorization:** Admin only

**Notes:** Any subset of fields from create payload; at least one field required.

#### 5. Delete Therapy
```
DELETE /therapies/:id
```

**Authorization:** Admin only

---

## Lead Routes

### Base Path: `/leads`

**Global Requirements:**
- ✅ Basic Authentication required
- ✅ Admin can list/delete/convert; Admin/Doctor/Trainer can create/read/update
- **Lead Status Values:** `New`, `Contacted`, `Qualified`, `Warm`, `Hot`, `Cold`, `Converted`, `Lost`

#### 1. Create Lead
```
POST /leads
```

**Authorization:** Admin, Doctor, Trainer

**Request Body:**
```json
{
  "leadName": "Jane Prospect",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "source": "Landing Page",
  "interestedIn": "Premium Membership",
  "notes": "Prefers evening calls",
  "tags": ["premium", "warm"],
  "followUpDate": "2026-04-05T00:00:00Z",
  "ownerId": "507f1f77bcf86cd799439099"
}
```

#### 2. Get All Leads
```
GET /leads
```

**Authorization:** Admin only

#### 3. Get Lead by ID
```
GET /leads/:id
```

**Authorization:** Admin, Doctor, Trainer

#### 4. Update Lead
```
PATCH /leads/:id
```

**Authorization:** Admin, Doctor, Trainer

**Notes:** Any subset of fields from create payload; at least one field required.
**Field Notes:** `followUpDate` accepts ISO 8601 date-time strings.

#### 5. Delete Lead
```
DELETE /leads/:id
```

**Authorization:** Admin only

#### 6. Convert Lead to User
```
POST /leads/:id/convert
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "username": "jane_member", // optional, defaults to leadName
  "phone": "+1234567890",
  "age": "32",
  "gender": 1,
  "healthGoals": ["weight loss", "sleep"],
  "password": "securePass"
}
```

**Behavior:**
- If a user already exists with the lead email, the lead links to that user and is marked `Converted`.
- Otherwise, a new user is created with the provided details and the lead is marked `Converted`.

---

## Booking Routes

### Base Path: `/bookings`

**Global Requirements:**
- ✅ Basic Authentication required for all endpoints

#### 1. Create Booking
```
POST /bookings
```

**Authorization:** User (own), Admin (any user)

**Request Body:**
```json
{
  "bookingDate": "2026-03-25T10:00:00Z",
  "userId": "507f1f77bcf86cd799439011",
  "slotId": "507f1f77bcf86cd799439020",
  "serviceId": "507f1f77bcf86cd799439030",
  "reportId": "507f1f77bcf86cd799439040"
}
```

**Notes:**
- `userId` — Required for admin. Optional for users (uses their ID).
- `reportId` — Optional field

**Response (201 Created):**
```json
{
  "message": "Booking created",
  "booking": {
    "_id": "507f1f77bcf86cd799439050",
    "bookingDate": "2026-03-25T10:00:00Z",
    "status": 0,
    "user": "507f1f77bcf86cd799439011",
    "slot": "507f1f77bcf86cd799439020",
    "service": "507f1f77bcf86cd799439030",
    "report": "507f1f77bcf86cd799439040",
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 2. Get All Bookings
```
GET /bookings
```

**Authorization:** Admin only

---

#### 3. Get My Bookings
```
GET /bookings/me
```

**Authorization:** User only

**Response (200 OK):**
```json
{
  "bookings": [ /* array of current user's bookings */ ]
}
```

---

#### 4. Get Booking by ID
```
GET /bookings/:id
```

**Authorization:** Admin only

---

#### 5. Update Booking
```
PATCH /bookings/:id
```

**Authorization:** Admin only

**Request Body (all fields optional):**
```json
{
  "bookingDate": "2026-03-26T10:00:00Z",
  "slotId": "507f1f77bcf86cd799439021",
  "serviceId": "507f1f77bcf86cd799439031",
  "reportId": "507f1f77bcf86cd799439041"
}
```

---

#### 6. Delete Booking
```
DELETE /bookings/:id
```

**Authorization:** Admin only

---

#### 7. Change Booking Status
```
PATCH /bookings/:id/status
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "status": 1
}
```

**Status Values:**
- `0` — Booked
- `1` — Confirmed
- `2` — Cancelled
- `3` — Attended
- `4` — Unattended

---

## Appointment Routes

### Base Path: `/appointments`

**Global Requirements:**
- ✅ Basic Authentication required for all endpoints

#### 1. Create Appointment
```
POST /appointments
```

**Authorization:** Admin only

**Request Body:**
```json
{
  "appointmentDate": "2026-03-25T10:00:00Z",
  "userId": "507f1f77bcf86cd799439011",
  "slotId": "507f1f77bcf86cd799439020",
  "doctorId": "507f1f77bcf86cd799439012",
  "reportId": "507f1f77bcf86cd799439040"
}
```

**Response (201 Created):** Similar to booking creation

---

#### 2. Get All Appointments
```
GET /appointments
```

**Authorization:** Admin only

---

#### 3. Get My Appointments
```
GET /appointments/me
```

**Authorization:** Doctor only

**Response (200 OK):**
```json
{
  "appointments": [ /* array of doctor's appointments */ ]
}
```

---

#### 4. Get Appointment by ID
```
GET /appointments/:id
```

**Authorization:** Admin only

---

#### 5. Update Appointment
```
PATCH /appointments/:id
```

**Authorization:** Admin only

**Request Body (all fields optional):**
```json
{
  "appointmentDate": "2026-03-26T10:00:00Z",
  "slotId": "507f1f77bcf86cd799439021",
  "doctorId": "507f1f77bcf86cd799439013",
  "reportId": "507f1f77bcf86cd799439041"
}
```

---

#### 6. Delete Appointment
```
DELETE /appointments/:id
```

**Authorization:** Admin only

---

#### 7. Change Appointment Status
```
PATCH /appointments/:id/status
```

**Authorization:** Admin, Doctor

**Request Body:**
```json
{
  "status": 1
}
```

**Status Values:** (See Booking status values)

---

## Schedule Routes

### Base Path: `/schedules`

**Global Requirements:**
- ✅ Basic Authentication required for all endpoints

#### 1. Get My Schedule
```
GET /schedules/my-schedule
```

**Authorization:** All authenticated users

**Response (200 OK):**
```json
{
  "message": "Schedule retrieved",
  "schedule": {
    "_id": "507f1f77bcf86cd799439060",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "scheduledDate": "2026-03-25T00:00:00Z",
    "status": 0,
    "todos": [ /* array of todo objects */ ],
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  }
}
```

---

#### 2. Create Schedule
```
POST /schedules
```

**Authorization:** User (own), Doctor/Trainer/Admin (any user)

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "scheduledDate": "2026-03-25T00:00:00Z",
  "status": 0,
  "todoIds": ["507f1f77bcf86cd799439070", "507f1f77bcf86cd799439071"]
}
```

**Notes:**
- `status` — Optional, defaults to 0 (Todo)
- `todoIds` — Optional, defaults to empty array

**Response (201 Created):**
```json
{
  "message": "Schedule created successfully",
  "schedule": { /* schedule object with populated user and todos */ }
}
```

---

#### 3. Get Schedule by User ID
```
GET /schedules/:userId
```

**Authorization:** User (own), Doctor/Trainer/Admin (any user)

**URL Params:**
- `userId` (string, required) — User MongoDB ObjectId

**Response (200 OK):**
```json
{
  "message": "Schedule retrieved successfully",
  "schedule": { /* schedule object */ }
}
```

---

#### 4. Update Schedule
```
PATCH /schedules/:userId
```

**Authorization:** User (own), Doctor/Trainer/Admin (any user)

**URL Params:**
- `userId` (string, required) — User MongoDB ObjectId

**Request Body (all fields optional):**
```json
{
  "scheduledDate": "2026-03-26T00:00:00Z",
  "status": 1,
  "todoIds": ["507f1f77bcf86cd799439070"]
}
```

**Response (200 OK):**
```json
{
  "message": "Schedule updated successfully",
  "schedule": { /* updated schedule object */ }
}
```

---

#### 5. Reschedule (Within 7 Days)
```
PATCH /schedules/:userId/reschedule
```

**Authorization:** User (own), Doctor/Trainer/Admin (any user)

**URL Params:**
- `userId` (string, required) — User MongoDB ObjectId

**Request Body:**
```json
{
  "newScheduledDate": "2026-03-27T00:00:00Z"
}
```

**Business Logic:**
- New date must be within **next 7 days** (0-7 days from today)
- Returns `400` if date is beyond 7 days

**Response (200 OK):**
```json
{
  "message": "Schedule rescheduled successfully",
  "schedule": { /* rescheduled schedule object */ }
}
```

---

#### 6. Delete Schedule
```
DELETE /schedules/:userId
```

**Authorization:** Admin only

**URL Params:**
- `userId` (string, required) — User MongoDB ObjectId

**Response (200 OK):**
```json
{
  "message": "Schedule deleted successfully"
}
```

---

## Enums & Status Codes

### Booking/Appointment Status
```javascript
{
  0: "Booked",
  1: "Confirmed",
  2: "Cancelled",
  3: "Attended",
  4: "Unattended"
}
```

### Schedule/Todo Status
```javascript
{
  0: "Todo",
  1: "Doing",
  2: "Done"
}
```

### Gender
```javascript
{
  0: "Male",
  1: "Female",
  2: "Others"
}
```

### Lead Status
```javascript
{
  "New": "New",
  "Contacted": "Contacted",
  "Qualified": "Qualified",
  "Warm": "Warm",
  "Hot": "Hot",
  "Cold": "Cold",
  "Converted": "Converted",
  "Lost": "Lost"
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `200` | OK | Successful GET/PATCH |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid input, validation failed |
| `401` | Unauthorized | Missing/invalid credentials |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Email/resource already exists |
| `500` | Server Error | Unexpected server error |

### Error Response Format
```json
{
  "message": "Error description",
  "errors": [
    {
      "code": "validation_error",
      "path": ["fieldName"],
      "message": "Field validation failed"
    }
  ]
}
```

### Example Error Responses

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "message": "Forbidden"
}
```

**400 Bad Request (Validation):**
```json
{
  "message": "Invalid booking payload",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["userId"],
      "message": "Required"
    }
  ]
}
```

---

## Health Check

### Endpoint
```
GET /health
```

**Authentication:** ❌ None

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## Example Workflows

### Workflow 1: Patient Books a Service

1. **Patient signs up:** `POST /auth/signup`
2. **Patient logs in:** `POST /auth/login` → Get credentials
3. **Patient views slots:** `GET /slots` (needs admin credentials)
4. **Patient creates booking:** `POST /bookings` with their userId
5. **Patient checks booking:** `GET /bookings/me`

### Workflow 2: Admin Creates Doctor Schedule

1. **Admin logs in:** `POST /auth/login`
2. **Admin creates doctor:** `POST /doctors`
3. **Admin creates slots:** `POST /slots` for doctor availability
4. **Admin creates appointment:** `POST /appointments` linking doctor + patient + slot

### Workflow 3: Patient Track Daily Progress

1. **User logs in:** `POST /auth/login`
2. **Get personal schedule:** `GET /schedules/my-schedule`
3. **Update schedule status:** `PATCH /schedules/:userId` (change status from Todo → Doing → Done)
4. **Reschedule if needed:** `PATCH /schedules/:userId/reschedule` (within 7 days only)

---

## Notes for Development

- All timestamps are in **ISO 8601** format (UTC)
- All IDs are MongoDB **ObjectId** strings
- Passwords are currently stored as **plain text** (⚠️ Security issue for production)
- Date fields accept various formats that coerce to Date objects
- Array fields (like `specialities`, `todoIds`) default to empty arrays if not provided
- At least one field is required for PATCH operations
- Role-based access is enforced per endpoint

---

## Support & Questions

For questions or issues with the API:
1. Check this documentation
2. Review the endpoint authorization requirements
3. Verify Basic Auth headers are properly formatted
4. Check that resource IDs are valid MongoDB ObjectIds

**Last Updated:** March 21, 2026
