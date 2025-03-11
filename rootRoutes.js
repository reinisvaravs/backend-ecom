import express from "express";
import { accessProfile, loginUser, logoutUser } from "./controller.js";
import { authenticateUser } from "./authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", authenticateUser, accessProfile);

export default router;
