const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendVerifyEmail } = require('../helper/email.helper');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/ApiResponse');
const { htmlTemplateGenerator } = require('../utils/htmlTemplateGenerator');

const {
  sendEmailVerificationNotification,
} = require('../helper/notifications');

const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateToken');

const emailToken = require('../utils/emailToken');

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshTokens = async (payload) => {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error.message);
    throw new Error('Token generation failed');
  }
};

const registerUser = async (req, res) => {
  const { email, password, name, fcm_token } = req.body;
  let verificationToken = emailToken(20);

  if (!email || !password || !name) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Please Provide All Required Fields'));
  }

  if (
    email.length < 5 ||
    email.length > 100 ||
    password.length < 6 ||
    password.length > 64
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Email or Password Length is Invalid'));
  }

  const allowedDomains = ['@gmail.com', '@outlook.com', '@codeguyakash.in'];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(email) ||
    !allowedDomains.some((domain) => email.endsWith(domain))
  ) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          'Invalid Email Domain. Use @gmail.com, @outlook.com, @icloud.com, or @codeguyakash.in'
        )
      );
  }

  try {
    const [existingUsers] = await req.db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json(new ApiResponse(409, null, 'User Already Exists'));
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS) || 12
    );

    const uuid = uuidv4();
    let avatar = `https://robohash.org/${verificationToken}code?gravatar=hashed`;

    const [result] = await req.db.query(
      `INSERT INTO users 
    (uuid, name, email, password, is_verified, verification_token, avatar_url, fcm_token, created_at, updated_at) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        uuid,
        name,
        email,
        hashedPassword,
        false,
        verificationToken,
        avatar,
        fcm_token || null,
      ]
    );

    const user = {
      id: result.insertId,
      uuid,
      name,
      email,
      role: 'user',
      is_verified: false,
      fcm_token: fcm_token || null,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);

    await req.db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [
      refreshToken,
      result.insertId,
    ]);

    let emailResponse = await sendVerifyEmail(email, name, verificationToken);
    // if (fcm_token) {
    //   console.log('Notification Sent Successfully');
    //   setTimeout(() => {
    //     sendEmailVerificationNotification({ fcm_token });
    //   }, 5000);
    // }

    if (!emailResponse.error) {
      console.log('Email Sent Successfully');
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, refreshToken },
          'User Registered Successfully, Please Verify Your Email to Complete Registration'
        )
      );
  } catch (err) {
    console.error('Registration error:', err);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'Please Provide Email and Password'));
    }

    if (
      email.length < 5 ||
      email.length > 100 ||
      password.length < 6 ||
      password.length > 64
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, 'Email or Password Length is Invalid')
        );
    }

    const allowedDomains = [
      '@gmail.com',
      '@outlook.com',
      '@icloud.com',
      '@codeguyakash.in',
    ];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email) ||
      !allowedDomains.some((domain) => email.endsWith(domain))
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            'Invalid Email Domain. Use @gmail.com, @outlook.com, @icloud.com, or @codeguyakash.in'
          )
        );
    }

    const [rows] = await req.db.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'User Not Found'));
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Invalid User Credentials'));
    }

    const payload = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified === 1 ? true : false,
      fcm_token: user.fcm_token || null,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(payload);

    await req.db.query(
      'UPDATE users SET refresh_token = ?, updated_at = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: payload, accessToken, refreshToken },
          'Login Successfully'
        )
      );
  } catch (error) {
    console.error('Login Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const allowedFields = ['name', 'email', 'role', 'is_verified', 'fcm_token'];

    const updateFields = Object.fromEntries(
      Object.entries(req.body).filter(
        ([key, value]) =>
          allowedFields.includes(key) &&
          value !== undefined &&
          value !== null &&
          value !== ''
      )
    );

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, 'No valid fields provided for update')
        );
    }

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateFields)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);

    await req.db.query(sql, values);

    return res
      .status(200)
      .json(new ApiResponse(200, { userId }, 'User Updated Successfully'));
  } catch (error) {
    console.error('Update User Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const logoutUser = async (req, res) => {
  try {
    let accessToken = req.cookies?.accessToken;
    let refreshToken = req.cookies?.refreshToken;

    if (!accessToken) {
      accessToken =
        req.headers['authorization']?.split(' ')[1] || req.body?.accessToken;
    }

    if (!refreshToken) {
      refreshToken = req.headers['x-refresh-token'] || req.body?.refreshToken;
    }

    const userId = req?.user?.id || null;

    if (!accessToken || !refreshToken) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'No Tokens Provided'));
    }

    if (userId) {
      await req.db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [
        userId,
      ]);
    }

    const response = res.status(200);
    if (req.cookies?.accessToken || req.cookies?.refreshToken) {
      response
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options);
    }

    return response.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    console.error('Logout Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const userDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId && !req.user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'User ID is Required'));
    }

    const [rows] = await req.db.query('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'User Not Found'));
    }

    const user = rows[0];
    const { password, refresh_token, verification_token, ...safeUser } = user;

    safeUser.is_verified = user.is_verified === 1 ? true : false;
    safeUser.fcm_token = user.fcm_token || null;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: safeUser },
          'User Details Retrieved Successfully'
        )
      );
  } catch (error) {
    console.error('User Details Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const userEmailVerify = async (req, res) => {
  try {
    const { token } = req?.query;

    const [result] = await req.db.query(
      'SELECT id FROM users WHERE verification_token = ?',
      [token]
    );

    if (result.length === 0) {
      return res
        .status(400)
        .send(
          htmlTemplateGenerator(
            'Email Verification',
            'Invalid or Expired Token',
            false
          )
        );
    }

    await req.db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?',
      [result[0].id]
    );

    return res
      .status(200)
      .send(
        htmlTemplateGenerator(
          'Email Verification',
          'Thank you for Verifying Your Email!',
          true
        )
      );
  } catch (error) {
    console.error('Verification Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const refreshAccessToken = async (req, res) => {
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (!incomingToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Refresh Token is Required'));
    }
    const decodedToken = jwt.verify(incomingToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    const [userRows] = await req.db.query('SELECT * FROM users WHERE id = ? ', [
      userId,
    ]);

    if (userRows.length === 0) {
      return res
        .status(403)
        .json(
          new ApiResponse(403, null, 'Invalid Refresh Token or User Not Found')
        );
    }
    const user = userRows[0];

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      uuid: user.uuid,
      is_verified: user.is_verified === 1,
    });

    await req.db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [
      refreshToken,
      user.id,
    ]);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'Access Token Refreshed Successfully'
        )
      );
  } catch (error) {
    console.log('Error in refreshAccessToken:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const allUsers = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * from users;');
    return res
      .status(200)
      .json(
        new ApiResponse(200, { users: rows }, 'Users Retrieved Successfully')
      );
  } catch (error) {
    console.error('User Retrieval Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const { all } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'User ID is Required'));
    }
    if (!all) {
      await req.db.query('DELETE FROM users WHERE id = ?', [userId]);
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'User Deleted Successfully'));
    }
    // delete all users
    await req.db.query('DELETE FROM users WHERE id > 0');
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'All Users Deleted Successfully'));
  } catch (error) {
    console.error('Delete User Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};

const verifyToken = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.body.accessToken;

    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Token is required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res
        .status(403)
        .json(new ApiResponse(403, null, 'Invalid or Expired Token'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Token Verified Successfully'));
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('Token has expired');
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Token has expired'));
    }

    console.error('Verify token error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};
const sendNotification = async (req, res) => {
  const {
    title = 'Default Title',
    body = 'Default Body',
    fcm_token,
  } = req.body;
  try {
    console.log({
      title,
      body,
      fcm_token,
    });
    if (!fcm_token) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'FCM Token is required'));
    }
    let response = await sendEmailVerificationNotification({
      title,
      body,
      fcm_token,
    });
    if (response.success === false) {
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, response.message || 'Notification Failed')
        );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, response, 'Notification Sent Successfully'));
  } catch (error) {
    console.error('Send Notification Error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal Server Error'));
  }
};
module.exports = {
  loginUser,
  registerUser,
  allUsers,
  userEmailVerify,
  deleteUser,
  logoutUser,
  refreshAccessToken,
  userDetails,
  verifyToken,
  updateUser,
  sendNotification,
};
