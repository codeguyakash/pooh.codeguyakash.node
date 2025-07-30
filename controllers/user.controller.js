const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { v4: uuidv4 } = require('uuid');

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

    const token = generateToken(
      {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
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
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
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
      'INSERT INTO users (uuid, name, email, password, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [uuid, name, email, hashedPassword, false]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      uuid,
      isVerified: false,
    };

    const token = generateToken(user, {
      expiresIn: '2h',
      issuer: '@codeguyakash',
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
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

module.exports = {
  loginUser,
  registerUser,
  allUsers,
};
