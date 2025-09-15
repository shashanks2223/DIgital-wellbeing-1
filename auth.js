import express from "express";
import bcrypt from "bcrypt";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function setupAuthRoutes(app) {
  app.use(express.json());

  app.post("/signup", async (req, res) => {
    try {
      const { username, email, password, userType } = req.body;

      if (!username || !email || !password || !userType) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        `INSERT INTO users (username, email, password, type) VALUES ($1, $2, $3, $4)`,
        [username, email, hashedPassword, userType]
      );

      res.json({ message: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  app.post("/signin", async (req, res) => {
    try {
      const { username, password, userType } = req.body;

      console.log(req.body);

      if (!username || !password || !userType) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const result = await pool.query(
        `SELECT * FROM users WHERE username = $1 AND type = $2`,
        [username, userType]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        message: "Login successful",
        user: {
          username: user.username,
          type: user.type,
          email: user.email,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
}
