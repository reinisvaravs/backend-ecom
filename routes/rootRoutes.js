import express from "express";
import { loginUser, logoutUser } from "../controller.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from the backend");
});
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
