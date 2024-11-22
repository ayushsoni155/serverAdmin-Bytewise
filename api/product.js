import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'PUT'], // Allow both GET and PUT methods
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Replace with your frontend URL
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end(); // Preflight response
  }

  // Handle PUT request to update product details
  if (req.method === 'PUT') {
    const { subject_code } = req.query; // Get subject_code from URL parameter
    const { pages, costPrice, sellingPrice } = req.body; // Get data from request body
  
    // Validate required fields
    if (!pages || !costPrice || !sellingPrice) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    const query = `
      UPDATE productbw
      SET pages = ?, costPrice = ?, sellingPrice = ?
      WHERE subject_code = ?
    `;
  
    try {
      // Get a connection from the pool
      const conn = await db.getConnection();
  
      // Execute the update query
      const [results] = await conn.query(query, [pages, costPrice, sellingPrice, subject_code]);
  
      // Check if any rows were affected
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Release the connection back to the pool
      conn.release();
  
      // Send success response
      res.json({ message: 'Product updated successfully' });
    } catch (err) {
      console.error('Error updating product:', err.message);
      res.status(500).json({ error: 'Failed to update product' });
    }
  } else {
    // If the method is not PUT, return 405 (Method Not Allowed)
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
