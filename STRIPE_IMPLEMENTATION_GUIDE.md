# 🎯 Stripe Implementation Guide - MedAdhere

## Overview

This guide documents the complete Stripe integration for MedAdhere's premium subscription system.

---

## 📦 What's Been Installed

```bash
npm install @stripe/stripe-js
```

**Package:** `@stripe/stripe-js` - Client-side Stripe library for secure payment processing

---

## 🏗️ Architecture

### Payment Flow

```
User → Premium Page → Click Subscribe → 
Firebase Cloud Function (creates Stripe Checkout Session) → 
Stripe Checkout (user pays) → 
Stripe Webhook → Firebase Cloud Function (verifies & updates Firestore) → 
Client reads Firestore → Premium Access Granted ✅
```

### Components

1. **Client-Side** (`src/pages/Premium.jsx`)
   - Stripe Checkout integration
   - Premium status display
   - Subscription management UI

2. **Server-Side** (Firebase Cloud Functions)
   - `createCheckoutSession` - Creates Stripe checkout
   - `stripeWebhook` - Handles payment events
   - `getSubscriptionStatus` - Checks user's subscription

3. **Database** (Firestore)
   - `subscriptions/{userId}` - User subscription data
   - `transactions/{transactionId}` - Payment transaction logs

4. **Security** (Firestore Rules)
   - Users can only read their own subscription
   - Only Cloud Functions can write subscriptions

---

## 🔧 Implementation Steps

### Step 1: Set Up Stripe Account

1. **Create Stripe Account:**
   - Go to https://stripe.com
   - Sign up for an account
   - Complete verification

2. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy **Publishable key** (starts with `pk_`)
   - Copy **Secret key** (starts with `sk_`)

3. **Create Product & Price:**
   - Dashboard → Products → Add Product
   - Name: "MedAdhere Premium"
   - Pricing: $4.99/month (or your preferred price)
   - Recurring: Monthly
   - Copy the **Price ID** (starts with `price_`)

4. **Set Up Webhook:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy **Webhook signing secret** (starts with `whsec_`)

---

### Step 2: Update Environment Variables

**`.env` (Local - DO NOT COMMIT):**
```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here
```

**`.env.example` (Template for others):**
```env
# Stripe Configuration (for premium subscriptions)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
# Server-side only (add to Firebase Functions config):
# STRIPE_SECRET_KEY=sk_test_your_secret_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
# STRIPE_PRICE_ID=price_your_price_id_here
```

---

### Step 3: Initialize Firebase Functions

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Initialize Functions
firebase init functions

# Choose:
# - JavaScript or TypeScript (recommend JavaScript for simplicity)
# - Install dependencies: Yes
```

**Install Stripe in Functions:**
```bash
cd functions
npm install stripe
cd ..
```

---

### Step 4: Configure Firebase Functions

**`functions/index.js`:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

admin.initializeApp();

// Create Stripe Checkout Session
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Create or retrieve Stripe customer
    let customer;
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customer = await stripe.customers.retrieve(userDoc.data().stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId
        }
      });

      // Save Stripe customer ID
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({ stripeCustomerId: customer.id }, { merge: true });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: functions.config().stripe.price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.returnUrl}?canceled=true`,
      metadata: {
        firebaseUID: userId
      }
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Stripe Webhook Handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// Handle successful checkout
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.firebaseUID;
  const subscriptionId = session.subscription;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update Firestore
  await admin.firestore()
    .collection('subscriptions')
    .doc(userId)
    .set({
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer,
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  // Log transaction
  await admin.firestore()
    .collection('transactions')
    .add({
      userId,
      type: 'subscription_created',
      stripeSubscriptionId: subscriptionId,
      amount: session.amount_total / 100,
      currency: session.currency,
      status: 'succeeded',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  console.log(`Subscription created for user ${userId}`);
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.firebaseUID;

  await admin.firestore()
    .collection('subscriptions')
    .doc(userId)
    .update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  console.log(`Subscription updated for user ${userId}`);
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.firebaseUID;

  await admin.firestore()
    .collection('subscriptions')
    .doc(userId)
    .update({
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  console.log(`Subscription canceled for user ${userId}`);
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.firebaseUID;

  // Log transaction
  await admin.firestore()
    .collection('transactions')
    .add({
      userId,
      type: 'payment_succeeded',
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'succeeded',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  console.log(`Payment succeeded for user ${userId}`);
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.firebaseUID;

  // Log transaction
  await admin.firestore()
    .collection('transactions')
    .add({
      userId,
      type: 'payment_failed',
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  console.log(`Payment failed for user ${userId}`);
}

// Get subscription status
exports.getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;

  try {
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .doc(userId)
      .get();

    if (!subscriptionDoc.exists) {
      return { isPremium: false };
    }

    const subscription = subscriptionDoc.data();
    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd.toDate();

    return {
      isPremium: subscription.status === 'active' && periodEnd > now,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

---

### Step 5: Set Firebase Functions Config

```bash
# Set Stripe configuration
firebase functions:config:set \
  stripe.secret_key="sk_test_your_secret_key" \
  stripe.webhook_secret="whsec_your_webhook_secret" \
  stripe.price_id="price_your_price_id"

# View config
firebase functions:config:get
```

---

### Step 6: Deploy Functions

```bash
firebase deploy --only functions
```

---

### Step 7: Update Firestore Rules

**`firestore.rules`:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Subscriptions - users can only read their own
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Transactions - users can only read their own
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // ... rest of your rules
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 📝 Summary

This implementation provides:
- ✅ Secure Stripe Checkout integration
- ✅ Server-side payment verification
- ✅ Firestore subscription management
- ✅ Webhook handling for all payment events
- ✅ Transaction logging
- ✅ Secure Firestore rules

**Next:** Update Premium.jsx to use the new Stripe integration!
