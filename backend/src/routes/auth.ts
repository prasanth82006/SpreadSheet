import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await (user as any).matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Google Sign-In / Sync
// @route   POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Create user if they don't exist
      // Since it's a first time google login, they don't have a password
      // We generate a random one to satisfy the model requirement
      const randomPassword = Math.random().toString(36).slice(-16);
      user = await User.create({ name, email, password: randomPassword });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error('Google sync error:', error);
    res.status(500).json({ message: 'Server error during Google sync' });
  }
});

export default router;
