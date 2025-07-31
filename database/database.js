const mysql = require('mysql2/promise');

let db = null;

const connectDB = async () => {
  if (db) return db;

  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'roottoor',
      database: process.env.DB_NAME || 'node_app',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });
    return db;
  } catch (error) {
    console.error('❌ DB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
