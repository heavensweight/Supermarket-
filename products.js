const express = require("express");
const db = require("../models/db");
const router = express.Router();

router.get("/", async (req, res) => {
  const products = await db.query("SELECT * FROM products");
  res.json(products.rows);
});

module.exports = router;
