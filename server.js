import express from "express";
import dotenv from "dotenv";
import { sql } from "./db.js";
import userRoutes from "./routes/userRoutes.js";
import rootRoutes from "./routes/rootRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.static("public"));

const allowedOrigins = ["http://localhost:3000", "https://reinisvaravs.com"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies/auth headers if needed
  })
);

// Apply express.json() only to non-webhook routes
app.use((req, res, next) => {
  if (req.path !== "/api/stripe/webhook") {
    express.json()(req, res, next); // Use express.json() for all other routes
  } else {
    next(); // Skip express.json() for webhook
  }
});
const PORT = process.env.PORT || 8383;

app.use("/", rootRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use("/api/stripe", stripeRoutes);

// Test Route for Stripe
app.get("/api/stripe/test", (req, res) => {
  res.json({ success: true, message: "Stripe is set up correctly!" });
});

// Ping Pong to wake up the backend
app.get("/api/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

async function initDB() {
  try {
    // Users table
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            plan VARCHAR(50),
            subscription_id VARCHAR(255),
            subscribed_at TIMESTAMP,
            subscription_status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Products table
    await sql`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            billing_period VARCHAR(50) NOT NULL,
            stripe_price_id VARCHAR(255) NOT NULL UNIQUE,
            description TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Insert default products if they don't exist
    await sql`
        INSERT INTO products (name, price, billing_period, stripe_price_id, description)
        VALUES 
            ('Cadet', 49.99, 'monthly', 'price_1R1VV3QHjri1zl3JyVpFFw5b', ARRAY['Access to all TRW Campuses', 'Daily live broadcasts', 'Daily course updates']),
            ('Challenger', 149.00, '3 months', 'price_1R1VYyQHjri1zl3J8Dc1i5em', ARRAY['All of Cadet', 'Daily coin bonus', 'Power level boost'])
        ON CONFLICT (stripe_price_id) DO NOTHING
    `;

    console.log("🗄️ Database initialized successfully");
  } catch (error) {
    console.log("Error initDB", error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅Server is running on port ${PORT}`);
  });
});
