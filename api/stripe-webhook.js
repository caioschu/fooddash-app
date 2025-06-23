const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSubscriptionChange(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  
  // Buscar usuário pelo email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', customer.email)
    .single();

  if (!user) {
    console.error('User not found for email:', customer.email);
    return;
  }

  // Buscar informações do preço
  const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
  const product = await stripe.products.retrieve(price.product);

  const subscriptionData = {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    plan_name: product.name,
    plan_price: price.unit_amount / 100,
    plan_interval: price.recurring.interval,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  // Upsert subscription
  await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { 
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false 
    });

  // Upsert customer
  await supabase
    .from('stripe_customers')
    .upsert({
      user_id: user.id,
      stripe_customer_id: subscription.customer,
      email: customer.email,
    }, { 
      onConflict: 'stripe_customer_id',
      ignoreDuplicates: false 
    });
}

async function handleSubscriptionDeleted(subscription) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (user) {
      const { data: subscriptionRecord } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subscriptionRecord) {
        await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            subscription_id: subscriptionRecord.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            description: `Pagamento da assinatura - ${invoice.lines.data[0]?.description || 'FoodDash'}`,
          });
      }
    }
  }
}

async function handlePaymentFailed(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (user) {
      const { data: subscriptionRecord } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subscriptionRecord) {
        await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            subscription_id: subscriptionRecord.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
            description: `Falha no pagamento da assinatura - ${invoice.lines.data[0]?.description || 'FoodDash'}`,
          });
      }
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};