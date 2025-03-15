import express from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controller.js";
import { body } from "express-validator";

const router = express.Router();

const inputValidation = [
  body("first_name")
    .trim()
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)
    .withMessage("First name must contain only letters"),
  body("last_name")
    .trim()
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)
    .withMessage("Last name must contain only letters"),
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

//  "localhost:3000/api/users/"
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", inputValidation, createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
