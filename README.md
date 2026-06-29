# Wander NA — Backend

REST API backend for a tour booking application. Built with Node.js, Express, and MongoDB.

**Production:** `https://wander-xggp.onrender.com`  
**API base path:** `/api/v1`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 10 |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (httpOnly cookie) + bcryptjs |
| Payments | Stripe |
| Email (dev) | Nodemailer + Mailtrap |
| Email (prod) | SendGrid |
| Image processing | Multer + Sharp |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `config.env`

This file is gitignored. Create it in the project root with the following variables:

```env
NODE_ENV=development
PORT=3500

DATABASE=mongodb+srv://<USER>:<PASSWORD>@cluster.mongodb.net/wander?retryWrites=true
DATABASE_PASSWORD=yourMongoPassword

JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Dev email (Mailtrap)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=25
EMAIL_USERNAME=yourMailtrapUser
EMAIL_PASSWORD=yourMailtrapPassword
EMAIL_FROM=hello@wander.dev

# Production email (SendGrid)
SENDGRID_USERNAME=apikey
SENDGRID_PASSWORD=yourSendGridApiKey
SENDGRID_EMAIL_FROM=hello@wander.dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Run the server

```bash
# Development (with nodemon + morgan logging)
npm start

# Production
npm run start:prod

# Debug (with ndb)
npm run debug
```

The server starts on `PORT` (default `3500`).

---

## API Reference

### Authentication

Auth uses a JWT stored in a `httpOnly` secure cookie (`sameSite: none`). All protected routes read the token from `req.cookies.jwt`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/users/signup` | Public | Register; sends welcome email |
| POST | `/api/v1/users/login` | Public | Login; sets JWT cookie |
| GET | `/api/v1/users/checkLogin` | Public | Returns login status and userId from cookie |
| GET | `/api/v1/users/logout` | Public | Clears JWT cookie |
| POST | `/api/v1/users/forgotPassword` | Public | Sends password reset email (valid 10 min) |
| PATCH | `/api/v1/users/resetPassword/:token` | Public | Resets password using emailed token |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/users` | Public | Get all active users |
| GET | `/api/v1/users/me` | Auth | Get current user's profile |
| PATCH | `/api/v1/users/updateMe` | Auth | Update name/email/photo (multipart) |
| DELETE | `/api/v1/users/deleteMe` | Auth | Soft-delete own account |
| PATCH | `/api/v1/users/updateMyPassword` | Auth | Change password |
| POST | `/api/v1/users` | Admin | Create user |
| GET | `/api/v1/users/:id` | Admin | Get user by ID |
| PATCH | `/api/v1/users/:id` | Admin | Update user |
| DELETE | `/api/v1/users/:id` | Admin | Delete user |

**Roles:** `user` · `guide` · `lead-guide` · `admin`

### Tours

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/tours` | Public | Get all tours (filterable) |
| POST | `/api/v1/tours` | Admin, Lead-guide | Create tour |
| GET | `/api/v1/tours/:id` | Public | Get tour (includes virtual reviews) |
| PATCH | `/api/v1/tours/:id` | Admin, Lead-guide | Update tour |
| DELETE | `/api/v1/tours/:id` | Admin, Lead-guide | Delete tour |
| GET | `/api/v1/tours/top-5-cheap` | Public | Top 5 cheapest highest-rated tours |
| GET | `/api/v1/tours/tour-stats` | Public | Aggregated stats grouped by difficulty |
| GET | `/api/v1/tours/monthly-plan/:year` | Admin, Lead-guide, Guide | Tour count per month for a given year |
| GET | `/api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit` | Public | Tours within radius (`mi` or `km`) |
| GET | `/api/v1/tours/distances/:latlng/unit/:unit` | Public | Distance from a point to every tour |

**Geo examples:**
```
GET /api/v1/tours/tours-within/200/center/34.052,-118.243/unit/mi
GET /api/v1/tours/distances/34.052,-118.243/unit/km
```

### Reviews

Can be accessed at both `/api/v1/reviews` and nested under `/api/v1/tours/:tourId/reviews`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/reviews` | Public | Get all reviews |
| GET | `/api/v1/reviews/:id` | Public | Get single review |
| POST | `/api/v1/reviews` | User | Create review |
| PATCH | `/api/v1/reviews/:id` | User, Admin | Update review |
| DELETE | `/api/v1/reviews/:id` | User, Admin | Delete review |

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/bookings/checkout-session/:tourId/:startDate` | Auth | Get Stripe checkout session |
| GET | `/api/v1/bookings/my-tours` | Auth | Get current user's bookings + tours |
| GET | `/api/v1/bookings` | Auth | Get all bookings |
| POST | `/api/v1/bookings` | Auth | Create booking |
| GET | `/api/v1/bookings/:id` | Admin, Lead-guide | Get booking |
| PATCH | `/api/v1/bookings/:id` | Admin, Lead-guide | Update booking |
| DELETE | `/api/v1/bookings/:id` | Admin, Lead-guide | Delete booking |

---

## Query String Features

Applies to any `GET all` endpoint (tours, users, reviews, bookings).

### Filtering

```
GET /api/v1/tours?difficulty=easy
GET /api/v1/tours?price[gte]=500&price[lte]=1500
GET /api/v1/tours?duration[gt]=7
```

Supported operators: `gte`, `gt`, `lte`, `lt`

HPP whitelist (allowed as arrays): `duration`, `ratingsAverage`, `ratingsQuantity`, `maxGroupSize`, `difficulty`, `price`

### Sorting

```
GET /api/v1/tours?sort=price          # ascending
GET /api/v1/tours?sort=-price         # descending
GET /api/v1/tours?sort=-ratingsAverage,price  # multi-field
```

### Field projection

```
GET /api/v1/tours?fields=name,price,difficulty
```

### Pagination

```
GET /api/v1/tours?page=2&limit=10
```

Default limit is 100.

---

## Data Models

### Tour

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, unique, 10–40 chars |
| `slug` | String | Auto-generated from name |
| `duration` | Number | Required (days) |
| `maxGroupSize` | Number | Required |
| `difficulty` | String | `easy` · `medium` · `hard` · `expert` |
| `ratingsAverage` | Number | 1–5, default 4.5 |
| `ratingsQuantity` | Number | Default 0 |
| `price` | Number | Required |
| `priceDiscount` | Number | Must be less than price |
| `summary` | String | Required |
| `description` | String | |
| `imageCover` | String | Required |
| `images` | [String] | |
| `startDates` | [Date] | |
| `secretTour` | Boolean | Hidden from public queries |
| `startLocation` | GeoJSON Point | `{ type, coordinates, address, description }` |
| `locations` | [GeoJSON Point] | Adds `day` field |
| `guides` | [ObjectId → User] | Populated on read |
| `durationWeeks` | Virtual | `duration / 7` |
| `reviews` | Virtual | Populated via Review.tour |

Indexes: `{ price: 1, ratingsAverage: -1 }`, `{ slug: 1 }`, `{ startLocation: '2dsphere' }`

### User

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique, validated |
| `photo` | String | Default `default.jpg` |
| `role` | String | `user` · `guide` · `lead-guide` · `admin` |
| `password` | String | Min 8 chars, bcrypt hashed, never selected |
| `passwordConfirm` | String | Validation only, not persisted |
| `passwordChangedAt` | Date | Set on password change |
| `passwordResetToken` | String | SHA-256 hashed token |
| `passwordResetExpires` | Date | 10 minutes from request |
| `active` | Boolean | Soft delete flag, never selected |

### Review

Belongs to a Tour and a User.

| Field | Type | Notes |
|---|---|---|
| `review` | String | Required |
| `rating` | Number | 1–5 |
| `tour` | ObjectId → Tour | Required |
| `user` | ObjectId → User | Required |

### Booking

| Field | Type | Notes |
|---|---|---|
| `tour` | ObjectId → Tour | Required |
| `user` | ObjectId → User | Required |
| `price` | Number | Required |
| `startDate` | Date | |
| `paid` | Boolean | Default true |

---

## Security

| Measure | Implementation |
|---|---|
| HTTP headers | `helmet` |
| Rate limiting | 500 req/hour per IP on `/api/*` |
| NoSQL injection | `express-mongo-sanitize` |
| XSS | `xss-clean` |
| Parameter pollution | `hpp` |
| CORS | Whitelist: `wander-xggp.onrender.com`, `localhost:3000` |
| Auth token | `httpOnly`, `secure`, `sameSite: none` cookie |
| Passwords | bcrypt (cost 10) |
| Reset tokens | Random 32-byte hex, stored SHA-256 hashed |

---

## Project Structure

```
├── app.js                  # Express app setup, middleware, routes
├── server.js               # DB connection, process error handlers
├── config.env              # Environment variables (gitignored)
├── controllers/
│   ├── authController.js   # signup, login, logout, protect, restrictTo, password reset
│   ├── bookingController.js
│   ├── errorController.js  # Global error handler
│   ├── handlerFactory.js   # Generic CRUD factory functions
│   ├── reviewController.js
│   ├── tourController.js
│   └── userController.js
├── models/
│   ├── bookingModel.js
│   ├── reviewModel.js
│   ├── startDateModel.js
│   ├── tourModel.js
│   └── userModel.js
├── routes/
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   ├── root.js
│   ├── tourRoutes.js
│   └── userRoutes.js
├── utils/
│   ├── apiFeatures.js      # Filter, sort, paginate, field-limit query builder
│   ├── appError.js         # Operational error class
│   ├── catchAsync.js       # Async error wrapper
│   └── email.js            # Nodemailer/SendGrid email class
└── public/                 # Static files (user photos, etc.)
```

---

## Stripe Payment Flow

1. Client calls `GET /api/v1/bookings/checkout-session/:tourId/:startDate` (auth required)
2. Server creates a Stripe checkout session and returns it
3. Client redirects to Stripe-hosted checkout page
4. On success, Stripe redirects to `https://wander-xggp.onrender.com/confirm-booking/?tour=...&user=...&price=...&startDate=...`
5. The `GET /api/v1/bookings/my-tours` endpoint reads those query params and creates the booking before returning the user's tour list
