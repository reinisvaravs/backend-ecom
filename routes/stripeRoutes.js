import express from "express";
import {
  cancelSubscription,
  checkUser,
  createCheckoutSession,
  stripeWebhook,
} from "../stripeController.js";
import { inputValidation } from "../stripeController.js";

const router = express.Router();

// Regular routes
router.post("/create-checkout-session", inputValidation, createCheckoutSession);
router.post("/cancel-subscription", cancelSubscription);
router.post("/check-user", checkUser);

// Webhook route - this should be handled by the raw body parser in server.js
router.post("/webhook", stripeWebhook);

export default router;
