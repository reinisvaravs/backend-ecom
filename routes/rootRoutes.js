import express from "express";
import { loginUser, logoutUser } from "../controller.js";
import { body } from "express-validator";

const router = express.Router();

const inputValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.get("/", (req, res) => {
  res.send("Hello from the backend 🧌");
});

router.get("/success", (req, res) => {
  res.send("Your payment has been successfull");
});

router.get("/cancel", (req, res) => {
  res.send("You successfully canceled your subscription");
});

router.post("/login", inputValidation, loginUser);

router.post("/logout", logoutUser);

export default router;
