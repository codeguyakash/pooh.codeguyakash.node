const { sendEmailVerificationNotification } = require('./helper/notifications');

const fcm_token =
  'dV472T9XQoCc8CW3VIV9Q9:APA91bFFJ8_qgsckLltzk3wpM5bdOI3R6XJajalRMMg25T87COYejCi9gzC-QVJ97jskDV1Zi4XXA7g6tsQFxTX8_Zyt7kiw-l-iE_eAtaOEYvDRl_6z7xg';

sendEmailVerificationNotification(fcm_token);
