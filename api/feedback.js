
import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Replace with your frontend URL
  credentials: true, // Allow credentials (cookies, etc.)
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Set your frontend URL
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials
    return res.status(200).end();
  }

  // Handle GET requests
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
         *
        FROM feedback
        INNER JOIN user_info 
        ON feedback.feedback_enrolmentID = user_info.enrolmentID
      `;
      const [feedbacks] = await db.query(query);

      return res.status(200).json(feedbacks); // Return combined feedback and user info
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Failed to retrieve feedbacks.' });
    }
  }

  // Handle non-GET requests
  return res.status(405).json({ message: 'Method Not Allowed' });
}
