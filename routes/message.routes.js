const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { sendMessage } = require('../controllers/message.controller');

router.post('/send-message', auth, sendMessage);

module.exports = router;
