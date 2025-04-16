import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

// Use the DATABASE_URL environment variable
const { DATABASE_URL } = process.env;

// Create a SQL connection using the connection string
export const sql = neon(DATABASE_URL);
