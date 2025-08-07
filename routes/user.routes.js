const express = require('express');
const router = express.Router();

const rateLimiter = require('../middlewares/ratelimiter.middleware');
const upload = require('../middlewares/upload.middleware');
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
  uploadAvatar,
} = require('../controllers/user.controller');

router.post('/login', loginUser);
router.post('/register', registerUser);

router.post('/token-refresh', refreshAccessToken);
router.post('/verify-token', verifyToken);

router.get('/logout', auth, logoutUser);
router.get('/users', auth, allUsers);
router.get('/user/:id', auth, userDetails);

router.delete('/user/delete/:id', auth, deleteUser);
router.put('/user/update/:id', auth, updateUser);
router.post(
  '/user/update/:id/avatar',
  auth,
  upload.single('avatar'),
  uploadAvatar
);

router.get('/', userEmailVerify);
router.post('/send-notification', sendNotification);

module.exports = router;
