import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['PUT', 'OPTIONS'], // Allow PUT and preflight
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Replace with your frontend URL
  credentials: true, // Allow credentials if needed
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

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  try {
    // Enable CORS for this API route
    await runMiddleware(req, res, cors);

    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Replace with your frontend URL
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end(); // Preflight response
    }

    // Only allow PUT requests
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Extract orderID from the URL and completeStatus from req.body
    const { orderID } = req.query; // Get orderID from the URL query parameters
    const { completeStatus } = req.body; // Get completeStatus from the request body

    // Validate inputs
    if (!orderID || !completeStatus) {
      return res.status(400).json({ message: 'Order ID and completeStatus are required' });
    }

    let paymentStatus = '';
    if (completeStatus === 'Completed') {
      paymentStatus = 'Done';
    } else if (completeStatus === 'Pending') {
      paymentStatus = 'Not_Done';
    } else {
      paymentStatus = 'Null';
    }

    // Get a connection from the pool
    const conn = await db.getConnection();

    try {
      // Update order status in the database
      const [result] = await conn.query(
        'UPDATE orders SET completeStatus = ?, paymentStatus = ? WHERE orderID = ?',
        [completeStatus, paymentStatus, orderID]
      );

      // Release the connection back to the pool
      conn.release();

      // Check if any rows were updated
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Send a success response
      return res.status(200).json({ message: 'Order status updated successfully!' });
    } catch (queryError) {
      throw queryError; // Throw the error to be caught in the outer catch block
    } finally {
      // Ensure connection is released even if there's an error
      conn.release();
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
}
