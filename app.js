const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/user.routes');
const messageRoutes = require('./routes/message.routes');

const os = require('os');

// const rateLimiter = require('./middlewares/ratelimiter.middleware');
const databaseMiddleware = require('./middlewares/db.middleware');

const app = express();

// app.use(rateLimiter(100, 15 * 60 * 1000));
app.use(databaseMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('public'));

app.use('/api/v1/auth', authRoutes);
app.use('/verify', authRoutes);
app.use('/api/v1/message', messageRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    system: {
      os: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpuUsage: os.loadavg(),
      uptime: os.uptime(),
      userInfo: os.userInfo(),
      numberOfCpus: os.cpus().length,
      memoryUsage: {
        total: os.totalmem(),
        free: os.freemem(),
      },
    },
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Login Auth API');
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
