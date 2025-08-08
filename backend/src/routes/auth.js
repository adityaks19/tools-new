const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { DynamoDBService } = require('../config/aws');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to get current month key
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Helper function to initialize user usage
const initializeUserUsage = async (userId) => {
  const monthKey = getCurrentMonthKey();
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1, 1); // First day of next month
  resetDate.setHours(0, 0, 0, 0);

  const usage = {
    userId,
    monthKey,
    conversions: 0,
    maxConversions: 10, // Free tier default
    resetDate: resetDate.toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_USAGE || 'user-usage', usage);
    return usage;
  } catch (error) {
    console.error('Error initializing user usage:', error);
    return usage; // Return default even if DB fails
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character (@$!%*?&)' });
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
      tier: 'FREE',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_USERS, user);

    // Initialize user usage
    await initializeUserUsage(userId);

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
        subscriptionTier: 'free',
        tier: 'FREE'
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
        subscriptionTier: user.subscriptionTier,
        tier: user.tier || 'FREE'
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
      tier: user.tier || 'FREE',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user usage
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const monthKey = getCurrentMonthKey();
    
    // Try to get current month usage
    let usage = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USAGE || 'user-usage',
      { userId: req.user.userId, monthKey }
    );

    // If no usage record exists for current month, initialize it
    if (!usage) {
      usage = await initializeUserUsage(req.user.userId);
    }

    // Get user tier to determine max conversions
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: req.user.userId }
    );

    const tierLimits = {
      'FREE': 10,
      'BASIC': 50,
      'ADVANCED': 200,
      'ENTERPRISE': 1000
    };

    const maxConversions = tierLimits[user?.tier] || 10;

    res.json({
      conversions: usage.conversions || 0,
      maxConversions,
      resetDate: usage.resetDate,
      monthKey
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    // Return default usage if there's an error
    res.json({
      conversions: 0,
      maxConversions: 10,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      monthKey: getCurrentMonthKey()
    });
  }
});

// Increment user usage
router.post('/usage/increment', authenticateToken, async (req, res) => {
  try {
    const monthKey = getCurrentMonthKey();
    
    // Get current usage
    let usage = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USAGE || 'user-usage',
      { userId: req.user.userId, monthKey }
    );

    // If no usage record exists, initialize it
    if (!usage) {
      usage = await initializeUserUsage(req.user.userId);
    }

    // Get user tier to check limits
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: req.user.userId }
    );

    const tierLimits = {
      'FREE': 10,
      'BASIC': 50,
      'ADVANCED': 200,
      'ENTERPRISE': 1000
    };

    const maxConversions = tierLimits[user?.tier] || 10;

    // Check if user has reached limit
    if (usage.conversions >= maxConversions) {
      return res.status(429).json({ 
        error: `Monthly conversion limit reached (${maxConversions}). Please upgrade your plan.`,
        conversions: usage.conversions,
        maxConversions,
        resetDate: usage.resetDate
      });
    }

    // Increment usage
    const newConversions = (usage.conversions || 0) + 1;
    
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_USAGE || 'user-usage',
      { userId: req.user.userId, monthKey },
      'SET conversions = :conversions, updatedAt = :updatedAt',
      { 
        ':conversions': newConversions,
        ':updatedAt': new Date().toISOString()
      }
    );

    res.json({
      conversions: newConversions,
      maxConversions,
      resetDate: usage.resetDate,
      monthKey
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    res.status(500).json({ error: 'Failed to update usage' });
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
      },
      { '#name': 'name' } // Expression attribute names for reserved keywords
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
