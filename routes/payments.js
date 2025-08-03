const express = require('express');
const router = express.Router();
const paypalService = require('../server/services/paypalService');
const auth = require('../middleware/auth');

// Create PayPal order for one-time payment
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const result = await paypalService.createOrder(amount, 'USD', description);
    
    if (result.success) {
      res.json({
        success: true,
        orderId: result.orderId,
        approvalUrl: result.approvalUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Capture PayPal payment
router.post('/capture-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await paypalService.captureOrder(orderId);
    
    if (result.success) {
      // TODO: Update user subscription status in database
      // TODO: Send confirmation email
      
      res.json({
        success: true,
        captureId: result.captureId,
        status: result.status,
        amount: result.amount
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create subscription plan
router.post('/create-plan', auth, async (req, res) => {
  try {
    const { planName, amount, interval } = req.body;
    
    if (!planName || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Plan name and valid amount are required'
      });
    }

    const result = await paypalService.createSubscriptionPlan(planName, amount, interval);
    
    if (result.success) {
      res.json({
        success: true,
        planId: result.planId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create subscription
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userEmail = req.user.email;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    const result = await paypalService.createSubscription(planId, userEmail);
    
    if (result.success) {
      res.json({
        success: true,
        subscriptionId: result.subscriptionId,
        approvalUrl: result.approvalUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    const result = await paypalService.cancelSubscription(subscriptionId, reason);
    
    if (result.success) {
      // TODO: Update user subscription status in database
      
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get subscription details
router.get('/subscription/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await paypalService.getSubscription(id);
    
    if (result.success) {
      res.json({
        success: true,
        subscription: result.subscription
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PayPal webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('PayPal Webhook Event:', event.event_type);
    
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Handle subscription activation
        console.log('Subscription activated:', event.resource.id);
        // TODO: Update user subscription status in database
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Handle subscription cancellation
        console.log('Subscription cancelled:', event.resource.id);
        // TODO: Update user subscription status in database
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Handle subscription suspension
        console.log('Subscription suspended:', event.resource.id);
        // TODO: Update user subscription status in database
        break;
        
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Handle successful payment
        console.log('Payment completed:', event.resource.id);
        // TODO: Process successful payment
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event_type);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

module.exports = router;
