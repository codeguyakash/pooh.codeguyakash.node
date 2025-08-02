const admin = require('../utils/firebaseAdmin');

const sendEmailVerificationNotification = async (fcmToken) => {
  const message = {
    notification: {
      title: 'Verify Your Email',
      body: 'Please verify your email to complete your registration.',
    },
    data: {
      type: 'EMAIL_VERIFICATION',
      screen: 'EmailVerifyScreen',
    },
    token: fcmToken,
  };
  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

module.exports = { sendEmailVerificationNotification };
