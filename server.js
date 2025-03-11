import express from "express";
import dotenv from "dotenv";
import { sql } from "./db.js";
import userRoutes from "./userRoutes.js";
import cookieParser from "cookie-parser";
import rootRoutes from "./rootRoutes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("<h1>Hello from the Backend!</h1>");
});

app.use("/api/users", userRoutes);
app.use("/", rootRoutes)

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
