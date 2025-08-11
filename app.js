const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/user.routes');
const messageRoutes = require('./routes/message.routes');
const path = require('path');

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

app.use('/avatar', express.static(path.join(__dirname, 'public/avatar')));

app.use('/api/v1/auth', authRoutes);
app.use('/verify', authRoutes);
app.use('/reset-password', authRoutes);
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
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Pooh (Node)</title>
      <link rel="icon" href="https://raw.githubusercontent.com/codeguyakash/com.pooh.codeguyakash/main/src/assets/icons/pooh.png" type="image/png" />
      <style>
       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          text-align: center;
          margin-top: 50px;
          background-color: #f5f5f5;
        }
        h1 {
          color: #333;
        }
      </style>
    </head>
    <body>
      <img src="https://raw.githubusercontent.com/codeguyakash/com.pooh.codeguyakash/main/src/assets/icons/pooh.png" alt="App Icon" width="100" />
      <h1>Pooh (Node) API</h1>
      <p style="margin: 0">
        <a
          href="https://codeguyakash.in"
          style="
            font-size: 13px;
            font-weight: 500;
            color: black;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            color:#BD4C00;
          ">
          @codeguyakash
        </a>
      </p>
    </body>
    </html>
  `);
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
