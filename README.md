# 🛠️ E-Commerce Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue?logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API-blueviolet?logo=stripe)](https://stripe.com/)
[![Powered by Render](https://img.shields.io/badge/Hosted%20on-Render-%230066ff?logo=render)](https://render.com/)
[![Status](https://img.shields.io/badge/status-live-brightgreen)]()

This is the backend API for my full-stack e-commerce store, built with **Node.js**, **Express.js**, and **PostgreSQL**. It powers the frontend available at [reinisvaravs.com/store](https://reinisvaravs.com/store) and handles user authentication, product data, Stripe checkout, and more.

- 🌐 Frontend Repository: [E-Commerce Frontend](https://github.com/reinisvaravs/frontend-ecom)

---

## 📦 Tech Stack

- Node.js + Express.js (API & server)
- PostgreSQL (NeonDB, with optional pgvector)
- Stripe API (subscription-based payments)
- JSON Web Tokens (JWT) for auth
- Express Validator for input validation
- bcrypt for password hashing
- Render.com (cloud hosting + auto-deploy)

---

## 🧠 Features

- 🔐 User registration & login with JWT auth
- 🧾 RESTful API using Express Router
- 🔄 Stripe subscriptions (checkout + webhook)
- 📧 Email-based plan management
- 🧪 REST Client test suite for local testing
- 📦 PostgreSQL + pgvector-ready database
- 🌍 CORS-enabled API access for frontend

---

## 🚀 Getting Started

Follow these steps to run the backend locally:

### 1. Clone the repository

```bash
git clone https://github.com/reinisvaravs/backend-ecom.git
cd backend-ecom
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root of the project:

```env
PORT=5000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

> You can get your `DATABASE_URL` from your PostgreSQL provider (e.g. NeonDB), and your `STRIPE_SECRET_KEY` from your Stripe dashboard.

### 4. Start the server

```bash
npm run dev
```

The server will run at `http://localhost:5000`.

---

## 📁 Project Structure

```
backend-ecom/
├── server.js               # Entry point
├── db.js                   # PostgreSQL connection setup
├── controller.js           # User & product logic
├── stripeController.js     # Stripe checkout handler
├── authMiddleware.js       # JWT middleware
│
├── routes/                 # API routes
│   ├── productRoutes.js
│   ├── userRoutes.js
│   ├── stripeRoutes.js
│   └── rootRoutes.js
│
├── public/                 # Static assets
│   ├── index.html
│   └── emoji.png
│
├── tests/                  # HTTP client requests
│   ├── stripe.rest
│   └── users.rest
│
├── .env.example            # Environment variable template
├── package.json
├── package-lock.json
└── node_modules/
```

---

## 🔌 API Endpoints

| Method | Endpoint                              | Description                     |
| ------ | ------------------------------------- | ------------------------------- |
| POST   | `/api/users`                          | Register new user               |
| POST   | `/api/login`                          | Authenticate existing user      |
| GET    | `/api/profile`                        | Get user profile (JWT required) |
| GET    | `/api/products`                       | Get all products/plans          |
| GET    | `/api/products/:id`                   | Get product by ID               |
| POST   | `/api/stripe/create-checkout-session` | Create Stripe checkout session  |
| POST   | `/api/stripe/check-user`              | Check if user exists            |
| POST   | `/api/stripe/cancel-subscription`     | Cancel user's subscription      |
| POST   | `/api/stripe/webhook`                 | Stripe webhook handler          |
| GET    | `/api/ping`                           | Health check (pong)             |
| GET    | `/api/stripe/test`                    | Test Stripe configuration       |

---

## 🛠 Notes

- Make sure your frontend is allowed in your CORS settings.
- All sensitive keys must be kept out of the codebase and stored in `.env`.
- Stripe’s webhooks can also be added if you want post-payment tracking.

---

## 📤 Deployment

This backend is deployed on [Render.com](https://render.com). On each push to the `main` branch, Render will auto-deploy the updated server.

---

## 📄 License

This project is licensed under the MIT License.
