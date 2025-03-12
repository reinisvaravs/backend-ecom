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
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

//  "localhost:3000/api/users/"
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", inputValidation, createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
