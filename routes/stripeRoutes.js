import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { sql } from "../db.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const { plan, email } = req.body;

  // Check if the user exists in the db
  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Checks if the user already has an active sub
    const existingSubscription = await sql`
      SELECT * FROM users WHERE email = ${email} AND subscription_id IS NOT NULL LIMIT 1;
    `;

    if (existingSubscription.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Database error" });
  }

  const prices = {
    cadet: "price_1R1VV3QHjri1zl3JyVpFFw5b",
    challenger: "price_1R1VYyQHjri1zl3J8Dc1i5em",
  };

  if (!prices[plan]) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid plan name" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      metadata: { plan: plan },
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res
      .status(200)
      .json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res
        .status(400)
        .json({ success: false, message: `Webhook Error: ${err.message}` });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const email = invoice.customer_email;
      console.log(`❌ Payment failed for ${email}`);

      // Update the user's subscription status in the database
      try {
        await sql`
          UPDATE users
          SET subscription_status = 'failed', subscription_id = NULL, plan = NULL
          WHERE email = ${email};
        `;
        console.log(
          `Database updated: Subscription for ${email} is now marked as 'failed'`
        );
      } catch (error) {
        console.error("❌ Error updating the database:", error.message);
      }

      return res.status(200).json({ received: true });
    }

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object;
    const email = session.customer_email;
    const subscriptionId = session.subscription;
    const plan = session.metadata.plan;

    try {
      await sql`
        UPDATE users
        SET subscription_id = ${subscriptionId}, plan = ${plan}, subscribed_at = NOW()
        WHERE email = ${email};
      `;

      console.log(`Subscription stored for ${email}`);
    } catch (dbError) {
      console.error("Database update failed:", dbError.message);
      return res
        .status(500)
        .json({ success: false, message: "Database update failed" });
    }

    res.status(200).json({ received: true });
  }
);

router.post("/cancel-subscription", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const subscriptionId = user[0].subscription_id;

    if (!subscriptionId) {
      return res
        .status(400)
        .json({ success: false, message: "No active subscription found" });
    }

    // Cancels the subscription with Stripe
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true, // Marks the subscription to be canceled at the end of the billing period
    });

    // Updates the user's subscription status in the database
    await sql`
        UPDATE users
        SET subscription_id = NULL, plan = NULL, subscribed_at = NULL
        WHERE email = ${email};
      `;

    console.log(`Subscription for ${email} has been canceled`);
    return res.status(200).json({
      success: true,
      message: `Subscription for ${email} has been canceled`,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
