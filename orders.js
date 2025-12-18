const express = require("express");
const db = require("../models/db");
const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, items, total } = req.body;
  const order = await db.query(
    "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *",
    [userId, total, "pending"]
  );

  const orderId = order.rows[0].id;

  for (let item of items) {
    await db.query(
      "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)",
      [orderId, item.id, item.quantity]
    );

    await db.query(
      "UPDATE products SET stock = stock - $1 WHERE id=$2",
      [item.quantity, item.id]
    );
  }

  const io = req.app.get("io");
  io.emit("order-updated", { orderId, status: "pending" });

  res.json({ orderId, status: "pending" });
});

module.exports = router;
