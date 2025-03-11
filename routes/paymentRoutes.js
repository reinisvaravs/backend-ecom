import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Stripe init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Creates a Stripe Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  const { productId } = req.body;

  const productPrices = {
    1: "price_1R1VV3QHjri1zl3JyVpFFw5b",
    2: "price_1R1VYyQHjri1zl3J8Dc1i5em",
    // hero plan is paid using crypto only
  };

  if (!productPrices[productId]) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: productPrices[productId],
          quantity: 1,
        },
      ],
      mode: "subscription", // For recurring payments
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
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

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handles different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Payment Successful:", session);
        // Able to now update the database, activate subscriptions, etc.
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

export default router;
