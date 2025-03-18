import express from "express";
import {
  cancelSubscription,
  checkUser,
  createCheckoutSession,
  stripeWebhook,
} from "../stripeController.js";

const router = express.Router();

router.post("/create-checkout-session", inputValidation, createCheckoutSession);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
router.post("/cancel-subscription", cancelSubscription);
router.post("/check-user", checkUser);

export default router;
