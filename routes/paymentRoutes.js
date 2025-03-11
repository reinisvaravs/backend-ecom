import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { sql } from "../db.js";

dotenv.config();
const router = express.Router();

// Stripe init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Creates a Stripe Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  const { email, productId } = req.body;

  const productPlans = {
    1: { priceId: "price_1R1VV3QHjri1zl3JyVpFFw5b", plan: "cadet" },
    2: { priceId: "price_1R1VYyQHjri1zl3J8Dc1i5em", plan: "challenger" },
  };

  if (!productPlans[productId]) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: productPlans[productId].priceId,
          quantity: 1,
        },
      ],
      mode: "subscription", // For recurring payments
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      customer_email: email, // ✅ Attach user email
      metadata: { plan: productPlans[productId].plan }, // ✅ Store the plan name in metadata
    });

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating checkout session" });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log(`🔹 Received Stripe Event: ${event.type}`);
      console.log(`🔹 Event Data:`, event.data.object);

      switch (event.type) {
        case "checkout.session.completed":
          console.log("✅ Checkout Session Completed:", event.data.object);

          const session = event.data.object;
          const email = session.customer_details.email;
          const plan = session.metadata.plan;
          const subscriptionId = session.subscription;

          // ✅ Store subscription in database
          await sql`
          UPDATE users 
          SET subscription_id = ${subscriptionId}, plan = ${plan}, subscribed_at = NOW()
          WHERE email = ${email}
        `;

          console.log(`✅ Subscription activated for ${email}: ${plan}`);
          break;

        case "invoice.payment_succeeded":
          console.log("✅ Invoice Payment Succeeded:", event.data.object);
          break;

        case "customer.subscription.deleted":
          console.log("🔹 Subscription canceled:", event.data.object.id);
          const canceledEmail = event.data.object.customer_email; // Get customer email
          await sql`
            UPDATE users SET subscription_status = 'canceled', subscription_expires_at = NOW()
            WHERE email = ${canceledEmail}
          `;
          break;

        default:
          console.log(`⚠️ Unhandled event type: ${event.type}`);
      }

      res.status(200).send();
    } catch (err) {
      console.error("❌ Error handling webhook:", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
