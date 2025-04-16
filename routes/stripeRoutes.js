import express from "express";
import {
  cancelSubscription,
  checkUser,
  createCheckoutSession,
  updateSubscriptionDetails,
} from "../stripeController.js";
import { inputValidation } from "../stripeController.js";

const router = express.Router();

// Regular routes
router.post("/create-checkout-session", inputValidation, createCheckoutSession);
router.post("/cancel-subscription", cancelSubscription);
router.post("/check-user", checkUser);
router.post("/update-subscription", updateSubscriptionDetails);

export default router;
