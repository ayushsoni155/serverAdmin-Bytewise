import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'], // Allow POST and OPTIONS methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  origin: 'https://admin-bytewise24.vercel.app', // Frontend URL
  credentials: true, // Allow cookies and credentials
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

// Helper function to generate a unique ID
function generateID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Create MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  // Enable CORS for this API route
  await runMiddleware(req, res, cors);

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end(); // Preflight response
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST method.' });
  }

  // Extract data from request body
  const { amount } = req.body;

  // Validate input
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid input. Provide a valid amount.' });
  }

  try {
    // Generate unique fundID
    const fundID = generateID();

    // Insert transaction into the `funds` table
    const query = `
      INSERT INTO funds (fundID, fund_date, credit)
      VALUES (?, CURRENT_DATE(), ?)
    `;
    await db.execute(query, [fundID, amount]);

    // Send success response
    return res.status(201).json({
      message: 'Credit transaction added successfully.',
      fundID,
      amount,
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to process the transaction. Please try again later.' });
  }
}
