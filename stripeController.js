import Stripe from "stripe";
import dotenv from "dotenv";
import { sql } from "./db.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const inputValidation = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .matches(/^[A-Za-zĀ-Žā-ž\s'-]+$/)
    .withMessage("First name must contain only Latvian letters and spaces"),
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .matches(/^[A-Za-zĀ-Žā-ž\s'-]+$/)
    .withMessage("Last name must contain only Latvian letters and spaces"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

export const createCheckoutSession = async (req, res) => {
  console.log("🟡 Raw Request Body:", req.body);

  const errors = validationResult(req);
  if (!errors || !errors.isEmpty()) {
    console.log("🔴 Validation Errors:", errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { plan, email, first_name, last_name, password } = req.body;
  console.log("🟢 Extracted Fields:", { email, plan });

  try {
    // ✅ Check if user already exists
    let user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;

    if (user.length === 0) {
      // ✅ Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

      // ✅ Insert user with hashed password
      await sql`
        INSERT INTO users (first_name, last_name, email, password, subscription_id, plan, subscribed_at)
        VALUES (${first_name}, ${last_name}, ${email}, ${hashedPassword}, NULL, NULL, NULL);
      `;
      console.log(`🟢 New user registered: ${email}`);

      // ✅ Retrieve the newly created user
      user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
    } else {
      console.log(`🟡 User already exists: ${email}`);
    }

    // ✅ Prevent multiple active subscriptions
    const existingSubscription = await sql`
      SELECT * FROM users WHERE email = ${email} AND subscription_id IS NOT NULL LIMIT 1;
    `;

    if (existingSubscription.length > 0) {
      return res.status(200).json({
        success: true,
        message: "User already has an active subscription",
        redirect: "/auth",
      });
    }

    // ✅ Define Stripe prices
    const prices = {
      cadet: "price_1R1VV3QHjri1zl3JyVpFFw5b",
      challenger: "price_1R1VYyQHjri1zl3J8Dc1i5em",
    };

    if (!prices[plan]) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan name" });
    }

    // ✅ Create Stripe checkout session
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
      metadata: { plan },
      success_url: `${
        process.env.FRONTEND_URL
      }/store/success?email=${encodeURIComponent(
        email
      )}&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${process.env.FRONTEND_URL}/store/cancel`,
    });

    res
      .status(200)
      .json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log("🔔 Webhook received with signature:", sig);
  console.log("🔍 Raw webhook body:", req.body);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook event constructed successfully:", event.type);
    console.log(
      "📦 Full event data:",
      JSON.stringify(event.data.object, null, 2)
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
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
    console.log("⏭️ Skipping non-checkout event:", event.type);
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email = session.customer_email;
  const subscriptionId = session.subscription;
  const plan = session.metadata.plan;

  console.log("📝 Processing checkout completion:", {
    email,
    subscriptionId,
    plan,
    sessionId: session.id,
  });

  // First, let's check if the user exists
  try {
    const userCheck =
      await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
    console.log("👤 User check result:", userCheck);

    if (userCheck.length === 0) {
      console.error("❌ User not found in database:", email);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const result = await sql`
        UPDATE users
        SET 
            subscription_id = ${subscriptionId}, 
            plan = ${plan}, 
            subscribed_at = NOW(),
            subscription_status = 'active'
        WHERE email = ${email}
        RETURNING *;
      `;

    console.log("✅ Database update result:", result);
    console.log(`Subscription stored for ${email}`);

    // Redirect to success page with subscription ID
    res.redirect(
      `${process.env.FRONTEND_URL}/store/success?email=${encodeURIComponent(
        email
      )}&plan=${encodeURIComponent(plan)}&subscription_id=${encodeURIComponent(
        subscriptionId
      )}`
    );
    return;
  } catch (dbError) {
    console.error("❌ Database update failed:", dbError.message);
    console.error("❌ Full error:", dbError);
    return res
      .status(500)
      .json({ success: false, message: "Database update failed" });
  }
};

export const cancelSubscription = async (req, res) => {
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
};

export const checkUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;

    if (user.length > 0) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        redirect: "/auth",
      });
    }

    res.status(200).json({ success: false, message: "User does not exist" });
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateSubscriptionDetails = async (req, res) => {
  const { email, subscriptionId, plan } = req.body;

  if (!email || !subscriptionId || !plan) {
    return res.status(400).json({
      success: false,
      message: "Email, subscriptionId, and plan are required",
    });
  }

  try {
    // First check if user exists
    const userCheck =
      await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
    console.log("👤 User check result:", userCheck);

    if (userCheck.length === 0) {
      console.error("❌ User not found in database:", email);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update subscription details
    const result = await sql`
      UPDATE users
      SET 
        subscription_id = ${subscriptionId}, 
        plan = ${plan}, 
        subscribed_at = NOW(),
        subscription_status = 'active'
      WHERE email = ${email}
      RETURNING *;
    `;

    console.log("✅ Manual update result:", result);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Manual update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
