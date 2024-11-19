
import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Set your frontend URL
  credentials: true,
});

// Setup the database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const express = require('express');
const router = express.Router();

// Apply CORS middleware to the route
router.use(cors);

// Fetch orders data
router.get('/ordersData', async (req, res) => {
  const query = `
    SELECT 
      orders.orderID,
      orders.order_date,
      orders.completeStatus,
      user_info.name,
      user_info.enrolmentID,
      user_info.phone,
      user_info.sem,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_name', productbw.product_name,
          'quantity', order_items.item_quantity
        )
      ) AS items
    FROM orders
    JOIN user_info ON orders.enrolmentID = user_info.enrolmentID
    JOIN order_items ON orders.orderID = order_items.orderID
    JOIN productbw ON order_items.subject_code = productbw.subject_code
    GROUP BY orders.orderID;
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
