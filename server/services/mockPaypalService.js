// Mock PayPal service for local development
class MockPayPalService {
  // Create payment order
  async createOrder(amount, currency = 'USD', description = 'NLP Converter Subscription') {
    try {
      console.log(`🎭 Mock PayPal: Creating order for $${amount} ${currency} - ${description}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        orderId: `MOCK_ORDER_${Date.now()}`,
        approvalUrl: `https://sandbox.paypal.com/checkoutnow?token=MOCK_TOKEN_${Date.now()}`
      };
    } catch (error) {
      console.error('Mock PayPal Create Order Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture payment
  async captureOrder(orderId) {
    try {
      console.log(`🎭 Mock PayPal: Capturing order ${orderId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        captureId: `MOCK_CAPTURE_${Date.now()}`,
        status: 'COMPLETED',
        payerEmail: 'demo@example.com',
        amount: {
          currency_code: 'USD',
          value: '9.99'
        }
      };
    } catch (error) {
      console.error('Mock PayPal Capture Order Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription plan
  async createSubscriptionPlan(planName, amount, interval = 'MONTH') {
    try {
      console.log(`🎭 Mock PayPal: Creating subscription plan ${planName} for $${amount}/${interval}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        planId: `MOCK_PLAN_${Date.now()}`
      };
    } catch (error) {
      console.error('Mock PayPal Create Plan Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription
  async createSubscription(planId, subscriberEmail) {
    try {
      console.log(`🎭 Mock PayPal: Creating subscription for ${subscriberEmail} with plan ${planId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        subscriptionId: `MOCK_SUB_${Date.now()}`,
        approvalUrl: `https://sandbox.paypal.com/webapps/billing/subscriptions/create?ba_token=MOCK_BA_TOKEN_${Date.now()}`
      };
    } catch (error) {
      console.error('Mock PayPal Create Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
    try {
      console.log(`🎭 Mock PayPal: Cancelling subscription ${subscriptionId} - ${reason}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      console.error('Mock PayPal Cancel Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      console.log(`🎭 Mock PayPal: Getting subscription details for ${subscriptionId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        subscription: {
          id: subscriptionId,
          status: 'ACTIVE',
          plan_id: 'MOCK_PLAN_123',
          subscriber: {
            email_address: 'demo@example.com'
          },
          billing_info: {
            outstanding_balance: {
              currency_code: 'USD',
              value: '0.00'
            },
            cycle_executions: [
              {
                tenure_type: 'REGULAR',
                sequence: 1,
                cycles_completed: 1,
                cycles_remaining: 0,
                current_pricing_scheme_version: 1
              }
            ]
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Mock PayPal Get Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MockPayPalService();
