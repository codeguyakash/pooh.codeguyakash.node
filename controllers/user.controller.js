const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendVerifyEmail } = require('../helper/email.helper');

const accessToken = require('../utils/accessToken');
const emailToken = require('../utils/emailToken');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        errorCode: 'AUTH_MISSING_FIELDS',
      });
    }

    const [rows] = await req.db.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    const token = accessToken(
      {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified === 1 ? true : false,
        name: user.name,
      },
      {
        expiresIn: '2h',
        issuer: '@codeguyakash',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified === 1 ? true : false,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const registerUser = async (req, res) => {
  const { email, password, name } = req.body;

  let verificationToken = emailToken(20);

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
      errorCode: 'AUTH_MISSING_FIELDS',
    });
  }

  try {
    const [existingUsers] = await req.db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        errorCode: 'AUTH_USER_EXISTS',
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS) || 12
    );

    const uuid = uuidv4();

    const [result] = await req.db.query(
      'INSERT INTO users (uuid, name, email, password, is_verified, verification_token ,created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [uuid, name, email, hashedPassword, false, verificationToken]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      uuid,
      is_verified: false,
    };

    const token = accessToken(user, {
      expiresIn: '2h',
      issuer: '@codeguyakash',
    });

    let emailResponse = await sendVerifyEmail(email, name, verificationToken);

    if (!emailResponse.error) {
      console.log('Email Sent Successfully', emailResponse.data.id);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful, please verify your email',
      token,
      user,
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'AUTH_REGISTER_FAILED',
    });
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
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
    return res.status(409).json({
      success: false,
      message: 'User already exists',
      errorCode: 'AUTH_USER_EXISTS',
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
  allUsers,
  verifyUser,
};
