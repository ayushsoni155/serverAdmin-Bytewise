import mysql from 'mysql2/promise';
import Cors from 'cors';
import express from 'express';

// Initialize the router
const router = express.Router();

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Replace with your frontend URL
  credentials: true,
});

// Setup the database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Apply CORS middleware to all requests handled by this router
router.use(async (req, res, next) => {
  try {
    await runMiddleware(req, res, cors);
    next();
  } catch (err) {
    res.status(500).json({ message: 'CORS error' });
  }
});

// Handle preflight requests
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.status(204).end(); // No content for OPTIONS request
});

// Fetch orders data
router.get('/orderData', async (req, res) => {
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
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
