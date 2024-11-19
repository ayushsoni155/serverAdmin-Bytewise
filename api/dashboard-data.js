import mysql from 'mysql2/promise';

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get a connection from the pool
    const conn = await db.getConnection();

    // Get the date from query parameters, default to today's date if not provided
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    // Fetch various dashboard statistics for the selected date
    const [totalUsersResult] = await conn.query('SELECT COUNT(*) AS totalUsers FROM user_info');
    const [todaysSaleResult] = await conn.query(
      'SELECT SUM(total_price) AS todaysSale FROM orders WHERE DATE(order_date) = ?',
      [selectedDate]
    );
    const [pendingOrdersResult] = await conn.query(
      `SELECT COUNT(*) AS pendingOrders 
       FROM orders 
       WHERE completeStatus = "Pending" AND DATE(order_date) = ?`,
      [selectedDate]
    );
    const [deliveredOrdersResult] = await conn.query(
      `SELECT COUNT(*) AS deliveredOrders 
       FROM orders 
       WHERE completeStatus = "Completed" AND DATE(order_date) = ?`,
      [selectedDate]
    );
    const [totalOrdersResult] = await conn.query(
      'SELECT COUNT(*) AS totalOrders FROM orders WHERE DATE(order_date) = ?',
      [selectedDate]
    );
    const [itemDetailsResult] = await conn.query(
      `SELECT 
          oi.subject_code AS code,
          pd.product_name AS name,
          SUM(oi.item_quantity) AS quantity
       FROM 
          order_items oi
       JOIN 
          productbw pd ON oi.subject_code = pd.subject_code
       JOIN 
          orders o ON oi.orderID = o.orderID
       WHERE 
          DATE(o.order_date) = ?
       GROUP BY 
          oi.subject_code, pd.product_name`,
      [selectedDate]
    );

    // Release the connection back to the pool
    conn.release();

    // Construct the response object
    const stats = {
      totalUsers: totalUsersResult[0]?.totalUsers || 0,
      todaysSale: todaysSaleResult[0]?.todaysSale || 0,
      pendingOrders: pendingOrdersResult[0]?.pendingOrders || 0,
      deliveredOrders: deliveredOrdersResult[0]?.deliveredOrders || 0,
      totalOrders: totalOrdersResult[0]?.totalOrders || 0,
      itemDetails: itemDetailsResult || [],
    };

    // Send the response
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
}
