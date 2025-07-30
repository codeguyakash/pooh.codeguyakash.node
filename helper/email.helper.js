const { Resend } = require('resend');
const resend = new Resend(process.env.API_KEY);

async function sendVerifyEmail(to, userName, token) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Hi ${userName},</p>
      <p>Thank you for registering! Please verify your email by clicking the button below:</p>
      <a href="${process.env.HOST_URL}/verify?token=${token}">
        Verify Email
      </a>
      <p>${process.env.HOST_URL}/verify?token=${token}</p>
      <p>If you did not register, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const res = await resend.emails.send({
      from: `NODE <no-reply@codeguyakash.in>`,
      to,
      subject: `Verify your email address`,
      html,
      text: `Please verify your email by clicking: ${process.env.HOST_URL}/verify?token=${token}`,
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
