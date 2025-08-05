const express = require('express');
const router = express.Router();

const rateLimiter = require('../middlewares/ratelimiter.middleware');
const auth = require('../middlewares/auth.middleware');

const {
  loginUser,
  registerUser,
  allUsers,
  userEmailVerify,
  logoutUser,
  refreshAccessToken,
  deleteUser,
  userDetails,
  verifyToken,
  updateUser,
  sendNotification,
} = require('../controllers/user.controller');

// router.post('/login', rateLimiter(10, 15 * 60 * 1000), loginUser);
// router.post('/register', rateLimiter(5, 60 * 60 * 1000), registerUser);

router.post('/login', loginUser);
router.post('/register', registerUser);

router.post('/token-refresh', refreshAccessToken);
router.post('/verify', verifyToken);

router.get('/logout', auth, logoutUser);
router.get('/users', auth, allUsers);
router.get('/user/:id', auth, userDetails);

router.delete('/user/delete/:id', auth, deleteUser);
router.put('/user/update/:id', auth, updateUser);

router.get('/', userEmailVerify);
router.post('/send-notification', sendNotification);

module.exports = router;
