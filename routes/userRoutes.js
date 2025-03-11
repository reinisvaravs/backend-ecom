import express from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controller.js";
import { sql } from "../db.js";
import { check } from "express-validator";

const router = express.Router();

// Validation Middleware for User Creation
const validateUser = [
  check("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isAlpha()
    .withMessage("First name must only contain letters"),
  check("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isAlpha()
    .withMessage("Last name must only contain letters"),
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (email) => {
      const existingUser =
        await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        throw new Error("Email already in use");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain at least one special character"),
];

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", validateUser, createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
