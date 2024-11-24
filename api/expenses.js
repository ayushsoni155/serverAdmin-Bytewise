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
  const { expenses_items, expenses_amount, expenses_date, payment_by } = req.body;

  // Validate required fields
  if (!expenses_items || !expenses_amount || !expenses_date || !payment_by) {
    return res.status(400).json({ error: 'All fields (items, amount, date, payment_by) are required.' });
  }

  try {
    // Insert expense data into the database
    const query = `
      INSERT INTO bytewise_db.expenses (expenses_items, expenses_amount, expenses_date, payment_by)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      expenses_items,
      expenses_amount,
      expenses_date,
      payment_by,
    ]);

    // Send success response with expense details
    return res.status(201).json({
      message: 'Expense saved successfully.',
      expense: {
        expensesID: result.insertId, // MySQL auto-generated ID
        expenses_items,
        expenses_amount,
        expenses_date,
        payment_by,
      },
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to save expense. Please try again later.' });
  }
}
