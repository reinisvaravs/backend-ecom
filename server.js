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

const allowedOrigins = [
  "http://localhost:3000",
  "https://reinisvaravs.com", 
];
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
