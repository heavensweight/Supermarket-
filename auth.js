const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models/db");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
    [name, email, hashed]
  );
  res.json({ message: "User created" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  if (!user.rows.length) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET);
  res.json({ token, name: user.rows[0].name });
});

module.exports = router;
