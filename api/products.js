// import mysql from 'mysql2/promise';
// import Cors from 'cors';

// // Initialize CORS middleware
// const cors = Cors({
//   methods: ['PUT', 'OPTIONS'], // Allow PUT and preflight
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   origin: 'https://admin-bytewise24.vercel.app', // Replace with your frontend URL
//   credentials: true, // Allow credentials if needed
// });

// // Helper function to run middleware
// // Helper function to run middleware
// function runMiddleware(req, res, fn) {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result) => {
//       if (result instanceof Error) {
//         return reject(result);
//       }
//       return resolve(result);
//     });
//   });
// }

// // Create a MySQL connection pool
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// export default async function handler(req, res) {
//   try {
//     // Enable CORS for this API route
//     await runMiddleware(req, res, cors);

//     // Handle OPTIONS request (preflight)
//     if (req.method === 'OPTIONS') {
//       res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
//       res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//       res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app'); // Replace with your frontend URL
//       res.setHeader('Access-Control-Allow-Credentials', 'true');
//       return res.status(200).end(); // Preflight response
//     }

//     // Only allow PUT requests
//     if (req.method !== 'PUT') {
//       return res.status(405).json({ message: 'Method Not Allowed' });
//     }

//     // Extract data from request
//     const { subject_code } = req.query; // Get subject_code from the URL
//     const { field, value } = req.body; // Dynamic field and value from request body

//     // Validate inputs
//     if (!subject_code || !field || !value) {
//       return res.status(400).json({ error: 'Subject code, field, and value are required.' });
//     }

//     const allowedFields = ['product_name', 'costPrice', 'sellingPrice', 'pages'];
//     if (!allowedFields.includes(field)) {
//       return res.status(400).json({ error: 'Invalid field specified.' });
//     }

//     const query = `UPDATE productbw SET ${field} = ? WHERE subject_code = ?`;

//     const conn = await db.getConnection();

//     try {
//       const [results] = await conn.query(query, [value, subject_code]);
//       conn.release();

//       if (results.affectedRows === 0) {
//         return res.status(404).json({ error: 'Product not found.' });
//       }

//       res.json({ message: 'Product updated successfully.' });
//     } catch (err) {
//       conn.release();
//       console.error('Error updating product:', err.message);
//       res.status(500).json({ error: 'Failed to update product.' });
//     }
//   } catch (error) {
//     console.error('Error handling request:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// }
import mysql from 'mysql2/promise';

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  try {
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Origin', 'https://admin-bytewise24.vercel.app');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end(); // Preflight response
    }

    // Allow only PUT requests
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Extract data
    const { subject_code } = req.query; // URL parameter
    const { field, value } = req.body; // Request body

    if (!subject_code || !field || !value) {
      return res.status(400).json({ error: 'Subject code, field, and value are required.' });
    }

    const allowedFields = ['product_name', 'costPrice', 'sellingPrice', 'pages'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field specified.' });
    }

    const query = `UPDATE productbw SET ${field} = ? WHERE subject_code = ?`;

    const conn = await db.getConnection();

    try {
      const [results] = await conn.query(query, [value, subject_code]);
      conn.release();

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      return res.json({ message: 'Product updated successfully.' });
    } catch (err) {
      conn.release();
      console.error('Database Error:', err.message);
      return res.status(500).json({ error: 'Failed to update product.' });
    }
  } catch (err) {
    console.error('Request Error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
