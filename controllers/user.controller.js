const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendVerifyEmail } = require('../helper/email.helper');

const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateToken');

const emailToken = require('../utils/emailToken');
const ApiResponse = require('../utils/ApiResponse');

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
      console.log('Email Sent Successfully', emailResponse.data.id);
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
    const { accessToken, refreshToken } = req?.cookies;
    let userId = req?.user?.id || null;

    if (!accessToken || !refreshToken) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'No tokens provided'));
    }
    await req.db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [
      userId,
    ]);

    return res
      .status(200)
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    console.error('❌ Logout error:', error.message);
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
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification token',
        errorCode: 'AUTH_INVALID_VERIFICATION_TOKEN',
      });
    }
    await req.db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?',
      [result[0].id]
    );

    return res.status(200).json({
      success: true,
      message: 'User verified successfully',
      token,
      userId: result[0]?.id || {},
    });
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
};

const allUsers = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * from users;');

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        rows,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
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
  logoutUser,
};
