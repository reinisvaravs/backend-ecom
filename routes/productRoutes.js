import express from "express";
const router = express.Router();

const products = [
  {
    id: 1,
    name: "Cadet",
    price: 49.99,
    billingPeriod: "monthly",
    description: [
      "Access to all TRW Campuses",
      "Daily live broadcasts",
      "Daily course updates",
    ],
  },
  {
    id: 2,
    name: "Challenger",
    price: 149.0,
    billingPeriod: "3 months",
    description: ["All of Cadet", "Daily coin bonus", "Power level boost"],
  },
  {
    id: 3,
    name: "Hero",
    price: 479.88,
    billingPeriod: "1 year",
    description: [
      "Maximum daily coin bonus",
      "Big power level boost",
      "Exclusive chats and lessons",
    ],
  },
];

router.get("/", (req, res) => {
  res.status(200).json({ success: true, products });
});

router.get("/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  res.status(200).json({ success: true, product });
});

export default router;