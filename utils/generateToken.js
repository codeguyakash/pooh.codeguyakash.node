const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '1h',
    issuer: '@codeguyakash.in',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
    issuer: '@codeguyakash.in',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
