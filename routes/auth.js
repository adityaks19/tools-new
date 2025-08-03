const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { DynamoDBService } = require('../config/aws');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { email }
    );

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const user = {
      userId,
      email,
      name,
      password: hashedPassword,
      subscriptionTier: 'free',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_USERS, user);

    // Generate JWT
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        userId,
        email,
        name,
        subscriptionTier: 'free'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { email }
    );

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: user.userId },
      'SET lastLogin = :lastLogin',
      { ':lastLogin': new Date().toISOString() }
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: req.user.userId }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: req.user.userId },
      'SET #name = :name, updatedAt = :updatedAt',
      { 
        ':name': name,
        ':updatedAt': new Date().toISOString()
      }
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
