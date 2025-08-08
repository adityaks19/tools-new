const jwt = require('jsonwebtoken');
const { DynamoDBService } = require('../config/aws');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to check if still active
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId: decoded.userId }
    );

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      subscriptionTier: user.subscriptionTier || 'free'
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const checkSubscription = (requiredTier = 'free') => {
  return async (req, res, next) => {
    const tierLevels = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3
    };

    const userTierLevel = tierLevels[req.user.subscriptionTier] || 0;
    const requiredTierLevel = tierLevels[requiredTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        required: requiredTier,
        current: req.user.subscriptionTier
      });
    }

    next();
  };
};

const checkUsageLimit = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = {
      userId: req.user.userId,
      date: today
    };

    const usage = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USAGE,
      usageKey
    );

    const limits = {
      'free': 5,
      'basic': 50,
      'premium': 200,
      'enterprise': 1000
    };

    const currentUsage = usage ? usage.count : 0;
    const limit = limits[req.user.subscriptionTier] || limits['free'];

    if (currentUsage >= limit) {
      return res.status(429).json({ 
        error: 'Daily usage limit exceeded',
        limit,
        used: currentUsage
      });
    }

    req.currentUsage = currentUsage;
    next();
  } catch (error) {
    console.error('Usage check error:', error);
    next(); // Continue on error to avoid blocking users
  }
};

module.exports = {
  authenticateToken,
  checkSubscription,
  checkUsageLimit
};
