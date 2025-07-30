const { Resend } = require('resend');
const resend = new Resend(process.env.API_KEY);

async function sendVerifyEmail(to, userName, token) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hi ${userName},</h2>
      <p>Thank you for registering! Please verify your email by clicking the button below:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}"
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>${process.env.FRONTEND_URL}/verify-email?token=${token}</p>
      <p>If you did not register, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const res = await resend.emails.send({
      from: `Login Auth🔒 <no-reply@codeguyakash.in>`,
      to,
      subject: `Verify your email address`,
      html,
      text: `Please verify your email by clicking: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    });

    return res;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message || error,
    };
  }
}

module.exports = {
  sendVerifyEmail,
};
