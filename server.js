import express from "express";
import dotenv from "dotenv";
import { sql } from "./db.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import rootRoutes from "./routes/rootRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import csurf from "csurf";

dotenv.config();

const app = express();

if (!process.env.PORT || !process.env.JWT_SECRET) {
  throw new Error("Missing required environment variables");
}

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next(); // Skip express.json() for Stripe webhooks
  } else {
    express.json()(req, res, next);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${res.statusCode}`);
  next();
});

// Security Middleware
app.use(helmet()); // Protects app with security headers
app.use(cors()); // Allows frontend to communicate with backend

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Request Logging
app.use(morgan("dev")); // Logs HTTP requests in terminal

// Rate Limiting (Prevents API abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.use("/", rootRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);

async function initDB() {
  try {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initDB", error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
