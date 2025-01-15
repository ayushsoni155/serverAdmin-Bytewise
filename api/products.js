import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['PUT', 'OPTIONS'], // Allow PUT and preflight
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Frontend URL
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

// Main handler function
export default async function handler(req, res) {
  try {
    // Run CORS middleware
    await runMiddleware(req, res, cors);

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Frontend URL
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end(); // Preflight response
    }

    // Handle only PUT requests
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Extract subject_code from URL and field/value from the body
   // const { subject_code } = req.query; // Subject code from the URL params
    const { subject_code,field, value } = req.body; // Dynamic field and value from the request body

    // Validate input fields
    if (!subject_code || !field || !value) {
      return res.status(400).json({ error: 'Subject code, field, and value are required.' });
    }

    const allowedFields = ['product_name', 'costPrice', 'sellingPrice', 'pages', 'marketPrice'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field specified.' });
    }

    // MySQL query to update the product details
    const query = `UPDATE productbw SET ${field} = ? WHERE subject_code = ?`;

    const conn = await db.getConnection();
    try {
      // Execute the query to update the product field
      const [results] = await conn.query(query, [value, subject_code]);
      conn.release();

      // Check if any row was updated
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      // Return success response
      return res.json({ message: 'Product updated successfully.' });
    } catch (err) {
      conn.release();
      console.error('Error updating product:', err.message);
      return res.status(500).json({ error: 'Failed to update product.' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
