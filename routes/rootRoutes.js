import express from "express";
import { loginUser, logoutUser } from "../controller.js";
import { body } from "express-validator";

const router = express.Router();

const inputValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.get("/", (req, res) => {
  res.send("Hello from the backend");
});

router.post("/login", inputValidation, loginUser);

router.post("/logout", logoutUser);

export default router;
