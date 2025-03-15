import express from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controller.js";
import inputValidation from "./stripeRoutes.js"

const router = express.Router();


//  "localhost:8383/api/users/"
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", inputValidation, createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
