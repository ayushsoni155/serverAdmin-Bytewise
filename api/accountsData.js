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
  // Enable CORS for this API route
  await runMiddleware(req, res, cors);

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST method.' });
  }

  try {
    // Fetch Available Funds
    const [fundsResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(credit), 0) AS totalCredit, 
         COALESCE(SUM(debit), 0) AS totalDebit 
       FROM funds`
    );
    const { totalCredit, totalDebit } = fundsResult[0];
    const availableFunds = totalCredit - totalDebit;

    // Fetch Gross Profit (Total Sales - Cost Price)
    const [salesResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(sale_price), 0) AS totalSales 
       FROM sales 
       WHERE status != 'cancelled'`
    );
    const [manualsResult] = await db.execute(
      `SELECT 
         COALESCE(SUM(cost_price), 0) AS totalCost 
       FROM manuals`
    );
    const totalSales = salesResult[0].totalSales;
    const totalCost = manualsResult[0].totalCost;
    const grossProfit = totalSales - totalCost;

    // Calculate Net Profit (Gross Profit - Total Debit)
    const netProfit = grossProfit - totalDebit;

    // Respond with calculated values
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
