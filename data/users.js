// data/users.js
const bcrypt = require('bcryptjs');

const users = [
  {
    id: '1',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Akash',
  },
];

module.exports = users;
