const jwt = require('jsonwebtoken');

module.exports = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    ...options,
  });
};
