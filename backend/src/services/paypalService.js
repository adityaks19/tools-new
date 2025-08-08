const paypal = require('@paypal/paypal-server-sdk');

// PayPal configuration
const environment = process.env.NODE_ENV === 'production' 
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID || 'AYour_PayPal_Client_ID_Here',
      process.env.PAYPAL_CLIENT_SECRET || 'Your_PayPal_Client_Secret_Here'
    );

const client = new paypal.core.PayPalHttpClient(environment);

class PayPalService {
  // Create payment order
  async createOrder(amount, currency = 'USD', description = 'NLP Converter Subscription') {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          },
          description: description
        }],
        application_context: {
          brand_name: 'NLP Converter',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel`
        }
      });

      const order = await client.execute(request);
      return {
        success: true,
        orderId: order.result.id,
        approvalUrl: order.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      console.error('PayPal Create Order Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture payment
  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const capture = await client.execute(request);
      return {
        success: true,
        captureId: capture.result.purchase_units[0].payments.captures[0].id,
        status: capture.result.status,
        payerEmail: capture.result.payer.email_address,
        amount: capture.result.purchase_units[0].payments.captures[0].amount
      };
    } catch (error) {
      console.error('PayPal Capture Order Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription plan
  async createSubscriptionPlan(planName, amount, interval = 'MONTH') {
    try {
      const request = new paypal.billing.PlansCreateRequest();
      request.requestBody({
        product_id: process.env.PAYPAL_PRODUCT_ID || 'PROD-NLP-CONVERTER',
        name: planName,
        description: `${planName} subscription for NLP Converter`,
        status: 'ACTIVE',
        billing_cycles: [{
          frequency: {
            interval_unit: interval,
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: amount.toString(),
              currency_code: 'USD'
            }
          }
        }],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      });

      const plan = await client.execute(request);
      return {
        success: true,
        planId: plan.result.id
      };
    } catch (error) {
      console.error('PayPal Create Plan Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create subscription
  async createSubscription(planId, subscriberEmail) {
    try {
      const request = new paypal.billing.SubscriptionsCreateRequest();
      request.requestBody({
        plan_id: planId,
        subscriber: {
          email_address: subscriberEmail
        },
        application_context: {
          brand_name: 'NLP Converter',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/success`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/cancel`
        }
      });

      const subscription = await client.execute(request);
      return {
        success: true,
        subscriptionId: subscription.result.id,
        approvalUrl: subscription.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      console.error('PayPal Create Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
    try {
      const request = new paypal.billing.SubscriptionsCancelRequest(subscriptionId);
      request.requestBody({
        reason: reason
      });

      await client.execute(request);
      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      console.error('PayPal Cancel Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const request = new paypal.billing.SubscriptionsGetRequest(subscriptionId);
      const subscription = await client.execute(request);
      
      return {
        success: true,
        subscription: subscription.result
      };
    } catch (error) {
      console.error('PayPal Get Subscription Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayPalService();
