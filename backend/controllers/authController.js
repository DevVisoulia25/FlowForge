const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const User = require('../models/User');

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'flowforge_secret_key_123', {
    expiresIn: '7d'
  });

  // Cross-domain cookie support for Vercel -> Render HTTPS requests
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction ? true : false,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

// @desc Register initial company & owner user
// @route POST /api/auth/register
// @access Public
const registerCompany = async (req, res, next) => {
  try {
    const { companyName, ownerName, username, password, industry, email, phone, address } = req.body;

    if (!companyName || !ownerName || !username || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create Company
    const company = await Company.create({
      name: companyName,
      industry: industry || 'General Manufacturing',
      email: email || '',
      phone: phone || '',
      address: address || '',
      isSetupComplete: false
    });

    // Create Owner User
    const owner = await User.create({
      companyId: company._id,
      name: ownerName,
      username: username.toLowerCase().trim(),
      password,
      role: 'owner'
    });

    generateToken(res, owner._id);

    res.status(201).json({
      user: {
        _id: owner._id,
        name: owner.name,
        username: owner.username,
        role: owner.role,
        companyId: company._id
      },
      company
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user (Owner or Department)
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).populate('departmentId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const company = await Company.findById(user.companyId);

    generateToken(res, user._id);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
        department: user.departmentId
      },
      company
    });
  } catch (error) {
    next(error);
  }
};

// @desc Logout user
// @route POST /api/auth/logout
// @access Public
const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction ? true : false,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
};

// @desc Get current user profile & company context
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('departmentId');
    const company = await Company.findById(req.companyId);
    res.json({ user, company });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  loginUser,
  logoutUser,
  getMe
};
