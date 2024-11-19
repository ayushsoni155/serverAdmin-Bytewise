import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers (adjust as needed)
  origin: 'https://admin-bytewise24.vercel.app', // Set your frontend URL
  credentials: true, // Allow cookies if needed
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

// Setup the database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  // Enable CORS for this API route
  await runMiddleware(req, res, cors);

  // Handle OPTIONS request (for preflight CORS check)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Set the frontend URL
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, etc.)
    return res.status(200).end();
  }

  // Handle PUT requests (update order status)
  if (req.method === 'PUT') {
    const { orderID } = req.query; // Get orderID from the query parameter
    const { completeStatus } = req.body; // Get completeStatus from the request body

    // Check if the completeStatus is provided
    if (!completeStatus) {
      return res.status(400).json({ message: 'Complete status is required' });
    }

    try {
      const conn = await db.getConnection();

      // Query to update the order status in the database
      const [result] = await conn.query(
        'UPDATE orders SET completeStatus = ? WHERE orderID = ?',
        [completeStatus, orderID]
      );
      conn.release();

      // If no rows are affected, that means the orderID does not exist
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Success response
      return res.status(200).json({ message: 'Order status updated successfully!' });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Handle non-PUT requests
  return res.status(405).json({ message: 'Method Not Allowed' });
}