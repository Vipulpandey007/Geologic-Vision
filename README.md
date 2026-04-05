# EduPlatform — Full-Stack Educational SaaS (Phase 1)

A production-ready educational platform with chapter-wise PDF content, secure viewing, Razorpay payments, and role-based access control.

---

## Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Frontend   | Next.js 14 (App Router) + Tailwind CSS       |
| Backend    | Node.js + Express                            |
| Database   | PostgreSQL via **Supabase** (recommended)    |
| ORM        | Prisma                                       |
| Auth       | OTP (Twilio) + JWT (access + refresh tokens) |
| Storage    | AWS S3 (private bucket)                      |
| Payment    | Razorpay                                     |
| PDF Viewer | PDF.js (pdfjs-dist)                          |

---

## Why These Choices?

- **PostgreSQL (Supabase)**: Relational schema, complex JOIN queries (purchases ↔ users ↔ courses). Supabase free tier = 500MB + hosted, no DevOps.
- **AWS S3 private bucket + Signed URLs**: PDFs never exposed directly. 5-minute expiring URLs prevent sharing/hotlinking.
- **JWT refresh tokens**: Students only OTP once every 30 days. Saves Twilio SMS costs significantly.
- **Next.js App Router**: Server components, built-in image optimization, better SEO.

---

## Project Structure

```
eduplatform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # All DB models
│   │   └── seed.js              # Admin + sample data seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # Prisma client singleton
│   │   │   ├── s3.js            # S3 client + signed URL + multer-s3
│   │   │   └── razorpay.js      # Razorpay client + signature verifier
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── course.controller.js
│   │   │   ├── chapter.controller.js
│   │   │   ├── pdf.controller.js
│   │   │   └── payment.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT + RBAC + purchase check
│   │   │   └── errorHandler.js      # Global error handler + AppError
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── course.routes.js
│   │   │   ├── chapter.routes.js
│   │   │   ├── pdf.routes.js
│   │   │   ├── payment.routes.js
│   │   │   └── admin.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.js           # Token generation & verification
│   │   │   ├── otp.service.js   # Twilio OTP send/verify
│   │   │   └── logger.js        # Winston logger
│   │   └── index.js             # Express app entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                          # Landing page
│   │   │   ├── layout.tsx                        # Root layout
│   │   │   ├── globals.css                       # Tailwind + custom styles
│   │   │   ├── auth/login/page.tsx               # OTP + Admin login
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx                      # Student course browser
│   │   │   │   └── my-courses/page.tsx           # Purchased courses
│   │   │   ├── course/[id]/
│   │   │   │   ├── page.tsx                      # Course detail + payment
│   │   │   │   └── pdf/[pdfId]/page.tsx          # Secure PDF viewer
│   │   │   └── admin/
│   │   │       ├── page.tsx                      # Admin dashboard + stats
│   │   │       ├── courses/
│   │   │       │   ├── page.tsx                  # Course list
│   │   │       │   ├── new/page.tsx              # Create course
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx              # Manage chapters & PDFs
│   │   │       │       └── edit/page.tsx         # Edit course
│   │   │       ├── students/page.tsx             # Student management
│   │   │       └── payments/page.tsx             # Payment history
│   │   ├── lib/
│   │   │   ├── axios.ts          # Axios instance + interceptors
│   │   │   ├── auth.ts           # Token helpers
│   │   │   ├── store.ts          # Zustand auth store
│   │   │   └── utils.ts          # cn(), formatCurrency(), etc.
│   │   └── types/
│   ├── .env.local.example
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Database Schema

```
User ──────────────┬── OtpRecord
                   ├── Payment
                   └── Purchase ──── Course ─── Chapter ─── Pdf
```

**Key relationships:**

- A user can purchase many courses → `Purchase(userId, courseId)` unique constraint
- Cascade deletes: Course → Chapter → Pdf (DB + S3 cleanup)
- OTPs are invalidated on use and have 10-minute TTL

---

## API Reference

### Auth

| Method | Endpoint                       | Auth   | Description          |
| ------ | ------------------------------ | ------ | -------------------- |
| POST   | `/api/auth/student/send-otp`   | Public | Send OTP to phone    |
| POST   | `/api/auth/student/verify-otp` | Public | Verify OTP → JWT     |
| POST   | `/api/auth/admin/login`        | Public | Email/password login |
| POST   | `/api/auth/refresh`            | Public | Refresh access token |
| GET    | `/api/auth/me`                 | JWT    | Get current user     |
| PATCH  | `/api/auth/profile`            | JWT    | Update name          |

### Courses

| Method | Endpoint                 | Auth   | Description                |
| ------ | ------------------------ | ------ | -------------------------- |
| GET    | `/api/courses`           | Public | List published courses     |
| GET    | `/api/courses/:id`       | Public | Course detail + chapters   |
| GET    | `/api/courses/admin/all` | Admin  | All courses (incl. draft)  |
| POST   | `/api/courses`           | Admin  | Create course              |
| PUT    | `/api/courses/:id`       | Admin  | Update course              |
| DELETE | `/api/courses/:id`       | Admin  | Delete course + S3 cleanup |

### Chapters

| Method | Endpoint                         | Auth           | Description      |
| ------ | -------------------------------- | -------------- | ---------------- |
| GET    | `/api/chapters/course/:courseId` | JWT + Purchase | Get chapters     |
| POST   | `/api/chapters`                  | Admin          | Create chapter   |
| PUT    | `/api/chapters/:id`              | Admin          | Update chapter   |
| DELETE | `/api/chapters/:id`              | Admin          | Delete chapter   |
| PATCH  | `/api/chapters/reorder`          | Admin          | Reorder chapters |

### PDFs

| Method | Endpoint                      | Auth           | Description          |
| ------ | ----------------------------- | -------------- | -------------------- |
| GET    | `/api/pdfs/:id/view`          | JWT + Purchase | Get 5-min signed URL |
| POST   | `/api/pdfs/upload/:chapterId` | Admin          | Upload PDF to S3     |
| PUT    | `/api/pdfs/:id`               | Admin          | Update PDF metadata  |
| DELETE | `/api/pdfs/:id`               | Admin          | Delete PDF + S3      |

### Payments

| Method | Endpoint                     | Auth  | Description            |
| ------ | ---------------------------- | ----- | ---------------------- |
| POST   | `/api/payments/create-order` | JWT   | Create Razorpay order  |
| POST   | `/api/payments/verify`       | JWT   | Verify + unlock course |
| GET    | `/api/payments/my-purchases` | JWT   | Student's purchases    |
| GET    | `/api/payments/history`      | Admin | All transactions       |

### Admin

| Method | Endpoint                         | Auth  | Description           |
| ------ | -------------------------------- | ----- | --------------------- |
| GET    | `/api/admin/stats`               | Admin | Dashboard statistics  |
| GET    | `/api/admin/students`            | Admin | List students         |
| PATCH  | `/api/admin/students/:id/toggle` | Admin | Block/unblock student |

---

## Setup Guide

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Supabase account)
- AWS account with S3 bucket
- Twilio account
- Razorpay account

---

### 1. Database — Supabase (Recommended, Free)

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy the **Connection String** from Settings → Database
3. Set `DATABASE_URL` in backend `.env`

---

### 2. AWS S3 — Private Bucket Setup

```bash
# Create S3 bucket (replace region/name)
aws s3api create-bucket \
  --bucket eduplatform-pdfs \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Block all public access
aws s3api put-public-access-block \
  --bucket eduplatform-pdfs \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::eduplatform-pdfs/*"
    }
  ]
}
```

Add CORS configuration to the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

---

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed admin user
npm run db:seed

# Start development server
npm run dev
```

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_RAZORPAY_KEY_ID

# Start development server
npm run dev
```

---

### 5. Docker (Production)

```bash
# From project root
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Fill in all credentials

docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

---

## Security Architecture

### PDF Security

1. PDFs stored in **private S3 bucket** — no public URLs ever
2. Backend generates **5-minute signed URLs** only after verifying:
   - Valid JWT token
   - Active purchase (or free course)
   - Non-expired purchase
3. Frontend uses **PDF.js** to render — no download links
4. **Right-click disabled** on viewer
5. **Ctrl+P / Ctrl+S blocked** via keyboard event handler
6. **Watermark** drawn directly on canvas with user phone/email
7. `pointer-events: none` on canvas prevents interaction

### Auth Security

- Refresh tokens (30-day) reduce OTP costs — students re-authenticate via token
- Passwords hashed with **bcryptjs** (12 rounds)
- Rate limiting: 3 OTP requests/minute, 100 global requests/15min
- JWT stored in **httpOnly cookies** recommended for production

### Payment Security

- Razorpay **signature verification** on every webhook
- Payment records saved before Razorpay flow
- Signature mismatch marks payment as FAILED in DB
- Purchase creation in **Prisma transaction** with payment update

---

## Environment Variables Reference

### Backend `.env`

```
DATABASE_URL            PostgreSQL connection string
JWT_SECRET              Min 32 chars, random
JWT_EXPIRES_IN          e.g. 7d
JWT_REFRESH_SECRET      Min 32 chars, different from JWT_SECRET
JWT_REFRESH_EXPIRES_IN  e.g. 30d
TWILIO_ACCOUNT_SID      From Twilio console
TWILIO_AUTH_TOKEN       From Twilio console
TWILIO_PHONE_NUMBER     Twilio number with +country code
AWS_REGION              e.g. ap-south-1
AWS_ACCESS_KEY_ID       IAM user key
AWS_SECRET_ACCESS_KEY   IAM user secret
AWS_S3_BUCKET_NAME      Private bucket name
AWS_S3_SIGNED_URL_EXPIRY  Seconds (default: 300)
RAZORPAY_KEY_ID         rzp_live_... or rzp_test_...
RAZORPAY_KEY_SECRET     From Razorpay dashboard
ADMIN_EMAIL             Initial admin email
ADMIN_PASSWORD          Initial admin password
FRONTEND_URL            http://localhost:3000 or prod URL
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL           http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID   rzp_test_... or rzp_live_...
```

---

## Cost Estimation (Phase 1)

| Service           | Free Tier                 | Estimated Cost  |
| ----------------- | ------------------------- | --------------- |
| Supabase          | 500MB DB + 2GB bandwidth  | **$0/month**    |
| AWS S3            | 5GB storage, 20K requests | ~$0.10–$2/month |
| Twilio OTP        | $0.0079/SMS               | ~$5–$20/month   |
| Razorpay          | 2% per transaction        | Per transaction |
| Vercel (Frontend) | 100GB bandwidth           | **$0/month**    |
| Railway (Backend) | 512MB RAM                 | $5/month        |

**Total: ~$5–$25/month** for a production platform.

JWT refresh tokens reduce Twilio costs by ~90% — users only OTP once per 30 days.

---

## Phase 2 Roadmap

- [ ] Video content support (HLS streaming)
- [ ] Quiz/assessment system
- [ ] Course completion certificates (PDF generation)
- [ ] Student progress tracking
- [ ] Course bundles & discount coupons
- [ ] Email notifications (purchase confirmation, OTP fallback)
- [ ] Admin analytics dashboard with charts
- [ ] Mobile app (React Native)
