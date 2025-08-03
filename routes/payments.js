const express = require('express');
const router = express.Router();

// Mock PayPal endpoints for development
router.post('/create-order', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    console.log(`🎭 Mock PayPal: Creating order for $${amount} - ${description}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      orderId: `MOCK_ORDER_${Date.now()}`,
      approvalUrl: `https://sandbox.paypal.com/checkoutnow?token=MOCK_TOKEN_${Date.now()}`
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    console.log(`🎭 Mock PayPal: Capturing order ${orderId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      captureId: `MOCK_CAPTURE_${Date.now()}`,
      status: 'COMPLETED',
      amount: {
        currency_code: 'USD',
        value: '9.99'
      }
    });
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/create-subscription', async (req, res) => {
  try {
    const { planId } = req.body;
    
    console.log(`🎭 Mock PayPal: Creating subscription with plan ${planId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      subscriptionId: `MOCK_SUB_${Date.now()}`,
      approvalUrl: `https://sandbox.paypal.com/webapps/billing/subscriptions/create?ba_token=MOCK_BA_TOKEN_${Date.now()}`
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('🎭 Mock PayPal Webhook Event:', event.event_type || 'mock_event');
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
