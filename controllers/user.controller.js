const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendVerifyEmail } = require('../helper/email.helper');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/ApiResponse');
const { htmlTemplateGenerator } = require('../utils/htmlTemplateGenerator');

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
  const { email, password, name } = req.body;

  let verificationToken = emailToken(20);

  if (!email || !password || !name) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Please provide all required fields'));
  }

  if (
    email.length < 5 ||
    email.length > 100 ||
    password.length < 6 ||
    password.length > 64
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Email or password length is invalid'));
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
          'Email Domain is not allowed, please use a valid email domain, such as @gmail.com, @outlook.com, @icloud.com, or @codeguyakash.in'
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
        .json(new ApiResponse(409, null, 'User already exists'));
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS) || 12
    );

    const uuid = uuidv4();

    const user = {
      name,
      email,
      role: 'user',
      uuid,
      is_verified: false,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);

    const [result] = await req.db.query(
      'INSERT INTO users (uuid, name, email, password, is_verified, verification_token,refresh_token ,created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        uuid,
        name,
        email,
        hashedPassword,
        false,
        verificationToken,
        refreshToken,
      ]
    );

    let emailResponse = await sendVerifyEmail(email, name, verificationToken);

    if (!emailResponse.error) {
      console.log('Email Sent Successfully');
    }

    user.id = result.insertId;

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, refreshToken },
          'Registration Successfully, please verify your email to complete registration'
        )
      );
  } catch (err) {
    console.error('Registration error:', err.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'Please provide email and password'));
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
          new ApiResponse(400, null, 'Email or password length is invalid')
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
            'Email Domain is not allowed, please use a valid email domain, such as @gmail.com, @outlook.com, @icloud.com, or @codeguyakash.in'
          )
        );
    }

    const [rows] = await req.db.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'User not found'));
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Invalid user credentials'));
    }
    const payload = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified === 1 ? true : false,
      name: user.name,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(payload);

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
    console.error('❌ Login error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const logoutUser = async (req, res) => {
  try {
    // Web: Tokens from cookies
    let accessToken = req.cookies?.accessToken;
    let refreshToken = req.cookies?.refreshToken;

    // Mobile: Tokens from headers or body (fallbacks)
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
        .json(new ApiResponse(400, null, 'No tokens provided'));
    }

    if (userId) {
      await req.db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [
        userId,
      ]);
    }

    // Clear cookies if present (for web clients)
    const response = res.status(200);
    if (req.cookies?.accessToken || req.cookies?.refreshToken) {
      response
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options);
    }

    return response.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const userDetails = async (req, res) => {
  console.log('Hit user details controller');
  try {
    const userId = req.params.id;

    console.log(userId, req.user);

    if (!userId && !req.user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'User ID is required'));
    }

    const [rows] = await req.db.query('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);
    console.log('Rows:', rows);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'User not found'));
    }

    const user = rows[0];
    const { password, refresh_token, verification_token, ...safeUser } = user;

    console.log(safeUser);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: safeUser },
          'User details retrieved successfully'
        )
      );
  } catch (error) {
    console.error('❌ User details error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const verifyUser = async (req, res) => {
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
            'Invalid or expired token',
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
          'Thank you for verifying your email!',
          true
        )
      );
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const refreshAccessToken = async (req, res) => {
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (!incomingToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'Refresh token is required'));
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
          new ApiResponse(403, null, 'Invalid refresh token or user not found')
        );
    }
    const user = userRows[0];

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      uuid: user.uuid,
      is_verified: user.is_verified,
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
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    console.log('❌ Error in refreshAccessToken:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const allUsers = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * from users;');
    return res
      .status(200)
      .json(
        new ApiResponse(200, { users: rows }, 'Users retrieved successfully')
      );
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const { all } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'User ID is required'));
    }
    if (!all) {
      await req.db.query('DELETE FROM users WHERE id = ?', [userId]);
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'User deleted successfully'));
    }
    // delete all users
    await req.db.query('DELETE FROM users WHERE id > 0');
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'All users deleted successfully'));
  } catch (error) {
    console.error('❌ Delete user error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

module.exports = {
  loginUser,
  registerUser,
  allUsers,
  verifyUser,
  deleteUser,
  logoutUser,
  refreshAccessToken,
  userDetails,
};
