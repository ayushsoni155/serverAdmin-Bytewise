import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  origin: 'https://admin-bytewise24.vercel.app', // Replace with your frontend URL
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

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  // Enable CORS for this API route
  await runMiddleware(req, res, cors);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Replace with your frontend URL
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end(); // Preflight response
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get a connection from the pool
    const conn = await db.getConnection();

    // Fetch orders data
    const query = `
      SELECT 
        orders.orderID,
        orders.order_date,
        orders.completeStatus,
        orders.payment_Method,
        orders.paymentStatus,
        user_info.name,
        user_info.enrolmentID,
        user_info.phone,
        user_info.sem AS semester,
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

    const [results] = await conn.query(query);

    // Release the connection back to the pool
    conn.release();

    // Send the response
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders data' });
  }
}
