const rateLimitStore = {};

const rateLimiter = (limit = 50, windowMs = 10 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip;

    const currentTime = Date.now();
    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }
    rateLimitStore[ip] = rateLimitStore[ip].filter(
      (timestamp) => currentTime - timestamp < windowMs
    );

    if (rateLimitStore[ip].length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, try again later.',
        errorCode: 'CUSTOM_RATE_LIMIT',
      });
    }

    rateLimitStore[ip].push(currentTime);
    next();
  };
};

module.exports = rateLimiter;
