const express = require('express');
const router = express.Router();

const {
  loginUser,
  registerUser,
  allUsers,
} = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/users', auth, allUsers);

module.exports = router;
