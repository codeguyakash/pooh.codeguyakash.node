require('dotenv').config();
const app = require('./app');
const connectDB = require('./database/database');

const PORT = process.env.PORT || 3000;

connectDB()
  .then((db) => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log('✅ Database connected successfully');
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
