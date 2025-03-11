import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { body } from "express-validator";

dotenv.config();

export const authenticateUser = (req, res, next) => {
  const token = req.cookies.token; // Extract token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request object
    next(); // Proceed to the next middleware/route
  } catch (error) {
    res
      .status(403)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

export const validateRegister = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];
