const express = require('express');
const router = express.Router();

const {
  loginUser,
  registerUser,
  allUsers,
  verifyUser,
  logoutUser,
  refreshAccessToken,
  deleteUser,
  userDetails,
  verifyToken
} = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/token-refresh', refreshAccessToken);
router.post('/verify', verifyToken);

router.get('/logout', auth, logoutUser);
router.get('/users', auth, allUsers);
router.get('/user/:id', auth, userDetails);
router.delete('/user/delete/:id', auth, deleteUser);

//verify user route
router.get('/', verifyUser);

module.exports = router;
