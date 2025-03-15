import express from "express";
import { loginUser, logoutUser } from "../controller.js";
import { body } from "express-validator";
import path from "path"
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get("/success", (req, res) => {
  res.send("Your payment has been successfull");
});

router.get("/cancel", (req, res) => {
  res.send("You successfully canceled your subscription");
});

router.post("/api/login", inputValidation, loginUser);

router.post("/api/logout", logoutUser);

export default router;
