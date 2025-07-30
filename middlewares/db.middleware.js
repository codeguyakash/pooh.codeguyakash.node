const connectDB = require('../database/database');

let db;

const databaseMiddleware = async (req, res, next) => {
  try {
    if (!db) {
      db = await connectDB();
    }
    req.db = db;
    next();
  } catch (err) {
    console.error('DB Middleware error:', err.message);
    res
      .status(500)
      .json({ success: false, message: 'Database connection error' });
  }
};

module.exports = databaseMiddleware;
