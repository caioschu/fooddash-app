import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import Stripe from "npm:stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error("Environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object, stripe, supabase);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
      
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object, stripe, supabase);
        break;
      
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object, stripe, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleSubscriptionChange(subscription, stripe, supabase) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  
  // Buscar usuário pelo email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", customer.email)
    .single();

  if (!user) {
    console.error("User not found for email:", customer.email);
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
    .from("subscriptions")
    .upsert(subscriptionData, { 
      onConflict: "stripe_subscription_id",
      ignoreDuplicates: false 
    });

  // Upsert customer
  await supabase
    .from("stripe_customers")
    .upsert({
      user_id: user.id,
      stripe_customer_id: subscription.customer,
      email: customer.email,
    }, { 
      onConflict: "stripe_customer_id",
      ignoreDuplicates: false 
    });
}

async function handleSubscriptionDeleted(subscription, supabase) {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentSucceeded(invoice, stripe, supabase) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", customer.email)
      .single();

    if (user) {
      const { data: subscriptionRecord } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (subscriptionRecord) {
        await supabase
          .from("payments")
          .insert({
            user_id: user.id,
            subscription_id: subscriptionRecord.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: "succeeded",
            description: `Pagamento da assinatura - ${invoice.lines.data[0]?.description || "FoodDash"}`,
          });
      }
    }
  }
}

async function handlePaymentFailed(invoice, stripe, supabase) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", customer.email)
      .single();

    if (user) {
      const { data: subscriptionRecord } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (subscriptionRecord) {
        await supabase
          .from("payments")
          .insert({
            user_id: user.id,
            subscription_id: subscriptionRecord.id,
            stripe_payment_intent_id: invoice.payment_intent,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: "failed",
            description: `Falha no pagamento da assinatura - ${invoice.lines.data[0]?.description || "FoodDash"}`,
          });
      }
    }
  }
}