const express = require('express');
const router = express.Router();

const {
  loginUser,
  registerUser,
  allUsers,
  verifyUser,
} = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/users', auth, allUsers);

//verify user route
router.get('/', verifyUser);

module.exports = router;
