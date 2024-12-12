import mysql from 'mysql2/promise';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'https://admin-bytewise24.vercel.app', // Your frontend origin
  credentials: true,
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
  try {
    // Enable CORS for this API route
    await runMiddleware(req, res, cors);

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end(); // Respond to preflight with status 200
    }

    // Allow only POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST method.' });
    }

    // Fetch available funds
    const [fundsResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(credit), 0) AS totalCredit, 
         COALESCE(SUM(debit), 0) AS totalDebit 
       FROM funds`
    );
    const { totalCredit, totalDebit } = fundsResult[0];
    const availableFunds = totalCredit - totalDebit;

    // Fetch total sales (excluding cancelled orders)
    const [salesResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(total_price), 0) AS totalSales 
       FROM orders
       WHERE completeStatus != 'cancelled'`
    );
    const totalSales = salesResult[0].totalSales;

    // Fetch total cost price
    const [manualsResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(costPrice), 0) AS totalCost 
       FROM productbw`
    );
    const totalCost = manualsResult[0].totalCost;

    // Calculate gross profit and net profit
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit - totalDebit;

    // Respond with calculated financial data
    return res.status(200).json({
      availableFunds,
      grossProfit,
      netProfit,
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to fetch financial data. Please try again later.' });
  }
}
