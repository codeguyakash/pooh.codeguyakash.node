const crypto = require('crypto');

module.exports = (length = 24) => {
  return crypto.randomBytes(length).toString('hex');
};
