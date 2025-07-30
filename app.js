const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/user.routes');
const rateLimiter = require('./middlewares/ratelimiter.middleware');
const databaseMiddleware = require('./middlewares/db.middleware');

const app = express();
app.use(rateLimiter(100, 15 * 60 * 1000));
app.use(databaseMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
