const express = require('express');
const router = express.Router();

const {
  loginUser,
  registerUser,
  allUsers,
  verifyUser,
  logoutUser,
  refreshAccessToken,
} = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/refresh-token', refreshAccessToken);

router.get('/logout', auth, logoutUser);
router.get('/users', auth, allUsers);

//verify user route
router.get('/', verifyUser);

module.exports = router;
