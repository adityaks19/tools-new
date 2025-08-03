const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { DynamoDBService } = require('../config/aws');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Subscription plans
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 9.99,
    priceId: 'price_basic_monthly', // Replace with actual Stripe price ID
    features: [
      '50 file processes per day',
      'Basic SEO analysis',
      'Standard file formats support',
      'Email support'
    ],
    limits: {
      dailyProcessing: 50,
      fileSize: 10 * 1024 * 1024, // 10MB
      features: ['basic-seo']
    }
  },
  premium: {
    name: 'Premium Plan',
    price: 29.99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      '200 file processes per day',
      'Advanced SEO analysis',
      'Content variations',
      'All file formats support',
      'Priority support'
    ],
    limits: {
      dailyProcessing: 200,
      fileSize: 50 * 1024 * 1024, // 50MB
      features: ['basic-seo', 'advanced-seo', 'content-variations']
    }
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 99.99,
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: [
      '1000 file processes per day',
      'Full SEO suite',
      'Unlimited content variations',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ],
    limits: {
      dailyProcessing: 1000,
      fileSize: 100 * 1024 * 1024, // 100MB
      features: ['basic-seo', 'advanced-seo', 'content-variations', 'api-access']
    }
  }
};

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan
    }))
  });
});

// Get current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId: req.user.userId }
    );

    if (!subscription) {
      return res.json({
        tier: 'free',
        status: 'active',
        features: [
          '5 file processes per day',
          'Basic file formats support',
          'Community support'
        ],
        limits: {
          dailyProcessing: 5,
          fileSize: 5 * 1024 * 1024, // 5MB
          features: []
        }
      });
    }

    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    res.json({
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      ...plan
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create checkout session
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const plan = SUBSCRIPTION_PLANS[planId];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: req.user.userId,
        planId: planId
      },
      subscription_data: {
        metadata: {
          userId: req.user.userId,
          planId: planId
        }
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const subscription = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId: req.user.userId }
    );

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update in database
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId: req.user.userId },
      'SET cancelAtPeriodEnd = :cancel, updatedAt = :updatedAt',
      {
        ':cancel': true,
        ':updatedAt': new Date().toISOString()
      }
    );

    res.json({ message: 'Subscription will be canceled at the end of the current period' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const subscription = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId: req.user.userId }
    );

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update in database
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId: req.user.userId },
      'SET cancelAtPeriodEnd = :cancel, updatedAt = :updatedAt',
      {
        ':cancel': false,
        ':updatedAt': new Date().toISOString()
      }
    );

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handlers
async function handleCheckoutCompleted(session) {
  const { userId, planId } = session.metadata;
  
  // Get the subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Create subscription record
  const subscription = {
    userId,
    tier: planId,
    status: 'active',
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_SUBSCRIPTIONS, subscription);

  // Update user's subscription tier
  await DynamoDBService.updateItem(
    process.env.DYNAMODB_TABLE_USERS,
    { userId },
    'SET subscriptionTier = :tier, updatedAt = :updatedAt',
    {
      ':tier': planId,
      ':updatedAt': new Date().toISOString()
    }
  );
}

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = stripeSubscription.metadata.userId;
    
    if (userId) {
      await DynamoDBService.updateItem(
        process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        { userId },
        'SET #status = :status, currentPeriodEnd = :periodEnd, updatedAt = :updatedAt',
        {
          ':status': 'active',
          ':periodEnd': new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          ':updatedAt': new Date().toISOString(),
          '#status': 'status'
        }
      );
    }
  }
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = stripeSubscription.metadata.userId;
    
    if (userId) {
      await DynamoDBService.updateItem(
        process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        { userId },
        'SET #status = :status, updatedAt = :updatedAt',
        {
          ':status': 'past_due',
          ':updatedAt': new Date().toISOString(),
          '#status': 'status'
        }
      );
    }
  }
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.userId;
  
  if (userId) {
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId },
      'SET #status = :status, currentPeriodEnd = :periodEnd, cancelAtPeriodEnd = :cancelAtEnd, updatedAt = :updatedAt',
      {
        ':status': subscription.status,
        ':periodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
        ':cancelAtEnd': subscription.cancel_at_period_end,
        ':updatedAt': new Date().toISOString(),
        '#status': 'status'
      }
    );
  }
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  
  if (userId) {
    // Update subscription status
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      { userId },
      'SET #status = :status, updatedAt = :updatedAt',
      {
        ':status': 'canceled',
        ':updatedAt': new Date().toISOString(),
        '#status': 'status'
      }
    );

    // Downgrade user to free tier
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId },
      'SET subscriptionTier = :tier, updatedAt = :updatedAt',
      {
        ':tier': 'free',
        ':updatedAt': new Date().toISOString()
      }
    );
  }
}

module.exports = router;
