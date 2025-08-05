const admin = require('../utils/firebaseAdmin');

const sendEmailVerificationNotification = async (data = {}) => {
  const { fcm_token } = data;

  console.log(data);

  const message = {
    notification: {
      title: data?.title || 'Verify Your Email',
      body:
        data.body || 'Please verify your email to complete your registration.',
    },
    data: {
      type: 'EMAIL_VERIFICATION',
      screen: 'EmailVerifyScreen',
    },
    token: fcm_token,
  };
  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      message: 'Failed to send notification',
      error: error.message || error,
    };
  }
};

module.exports = { sendEmailVerificationNotification };
