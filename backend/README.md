# ViralClothes.Shop - Backend API

Production-ready REST API for ViralClothes.Shop e-commerce platform.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + Bcrypt
- **Email:** Nodemailer
- **Validation:** express-validator
- **Logging:** Winston
- **Security:** Rate limiting, CORS, Helmet-ready

## Quick Start

```bash
cd backend
npm install
cp .env.example .env  # Edit with your values
npm run seed           # Seed demo data
npm run dev            # Start dev server
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | Register user |
| POST | `/api/auth/login` | - | Login |
| POST | `/api/auth/logout` | ✓ | Logout |
| POST | `/api/auth/refresh-token` | - | Refresh JWT |
| GET | `/api/auth/profile` | ✓ | Get profile |
| PUT | `/api/auth/profile` | ✓ | Update profile |
| POST | `/api/auth/change-password` | ✓ | Change password |
| POST | `/api/auth/forgot-password` | - | Forgot password |
| POST | `/api/auth/reset-password` | - | Reset password |
| GET | `/api/auth/verify-email/:token` | - | Verify email |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | - | List products |
| GET | `/api/products/featured` | - | Featured products |
| GET | `/api/products/best-sellers` | - | Best sellers |
| GET | `/api/products/new-arrivals` | - | New arrivals |
| GET | `/api/products/trending` | - | Trending |
| GET | `/api/products/search?q=` | - | Search |
| GET | `/api/products/:id` | - | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Categories, Brands, Orders, Coupons, Banners, Reviews
Full CRUD for each with appropriate auth protection.

### Admin
All admin routes prefixed with `/api/admin` and protected.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `SMTP_HOST` | Email server host |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `FRONTEND_URL` | Frontend URL for CORS |

## Demo Credentials

- **Admin:** admin@viralclothes.shop / Admin@123456
- **User:** john@example.com / Password123
