import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
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
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Set your frontend URL
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, etc.)
    return res.status(200).end();
  }

  // Handle DELETE requests
  if (req.method === 'DELETE') {
    const { enrolmentID } = req.query; // Retrieve enrollment ID from query parameters

    // Validate input
    if (!enrolmentID) {
      return res.status(400).json({ error: 'Enrollment ID is required.' });
    }

    try {
      // Query to delete the user by enrollment ID
      const query = `DELETE FROM user_info WHERE enrolmentID = ?`;
      const [result] = await db.query(query, [enrolmentID]);

      // Check if any row was affected
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Return success response
      return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Failed to delete user.' });
    }
  }

  // Handle unsupported HTTP methods
  return res.status(405).json({ message: 'Method Not Allowed' });
}
