const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 'RESEND_API_KEY');

async function sendVerifyEmail(to, userName, token) {
  const html = `
   <div
      style="
        max-width: 600px;
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.6;
        color: #000;
        text-align: left;
      ">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      </style>

      <p style="margin: 0 0 10px 0">
        Hii 👋
        <span
          style="color: black; font-weight: 600; border-bottom: 2px solid red">
          ${userName}
        </span>
        ,
      </p>
      <p style="margin: 0 0 10px 0">Thank you for Registering!</p>
      <p style="margin: 0 0 10px 0">
        Please verify your email by clicking the link below:
      </p>
      <a
        href="${process.env.HOST_URL}/verify?token=${token}"
        style="
          font-size: 13px;
          font-weight: 500;
          color: black;
          text-decoration: none;
          font-weight: 600;
          border-bottom: 2px solid red;
          cursor: pointer;
        ">
        Verify Email
      </a>
      <p style="margin: 5px 0">or</p>
      <a
        href="${process.env.HOST_URL}/verify?token=${token}"
        style="
          font-size: 13px;
          font-weight: 500;
          color: black;
          text-decoration: none;
          cursor: pointer;
          border-bottom: 1px solid red;
        ">
        ${process.env.HOST_URL}/verify?token=${token}
      </a>

      <p style="margin: 20px 0 10px 0">
        Thank you for using Amazon Web Services.
      </p>
      <p style="margin: 0">Sincerely,</p>
      <p style="margin: 0">
        <a
          href="https://codeguyakash.in"
          style="
            font-size: 13px;
            font-weight: 500;
            color: black;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
          ">
          CODEGUYAKASH
        </a>
      </p>
    </div>
`;

  try {
    const res = await resend.emails.send({
      from: `Pooh (codeguyakash) <no-reply@codeguyakash.in>`,
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
