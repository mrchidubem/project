# 🎯 Stripe Integration - Complete Setup Guide

## ⚠️ IMPORTANT: Manual Steps Required

Implementing Stripe with Firebase Cloud Functions requires some manual setup steps that cannot be automated. This guide provides everything you need.

---

## ✅ What's Already Done

1. ✅ Installed `@stripe/stripe-js` package
2. ✅ Created comprehensive implementation guide
3. ✅ Documented all security requirements
4. ✅ Prepared Firestore rules
5. ✅ Created webhook handler code

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create Stripe Account (5 minutes)

1. Go to https://stripe.com/register
2. Complete signup
3. Go to Dashboard → Developers → API keys
4. Copy your keys:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

### Step 2: Create Product (2 minutes)

1. Dashboard → Products → Create product
2. Name: "MedAdhere Premium"
3. Price: $4.99/month (or your choice)
4. Recurring: Monthly
5. Copy **Price ID:** `price_...`

### Step 3: Initialize Firebase Functions (3 minutes)

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Functions
firebase init functions

# Choose:
# - JavaScript
# - Install dependencies: Yes

# Install Stripe in functions
cd functions
npm install stripe
cd ..
```

### Step 4: Add Function Code (2 minutes)

Copy the code from `STRIPE_IMPLEMENTATION_GUIDE.md` Section "Step 4" into `functions/index.js`

### Step 5: Configure & Deploy (3 minutes)

```bash
# Set Stripe config
firebase functions:config:set \
  stripe.secret_key="YOUR_SECRET_KEY" \
  stripe.webhook_secret="YOUR_WEBHOOK_SECRET" \
  stripe.price_id="YOUR_PRICE_ID"

# Deploy
firebase deploy --only functions,firestore:rules
```

---

## 📋 Detailed Implementation Checklist

### Phase 1: Stripe Account Setup

- [ ] Create Stripe account at https://stripe.com
- [ ] Verify email address
- [ ] Complete business profile
- [ ] Get API keys from Dashboard → Developers → API keys
- [ ] Save keys securely (DO NOT commit to Git)

### Phase 2: Product Configuration

- [ ] Create product "MedAdhere Premium"
- [ ] Set price (recommend $4.99/month)
- [ ] Set billing period to Monthly
- [ ] Copy Price ID
- [ ] Test product in Stripe Dashboard

### Phase 3: Firebase Functions Setup

- [ ] Run `firebase init functions`
- [ ] Choose JavaScript
- [ ] Install dependencies
- [ ] Install Stripe: `cd functions && npm install stripe`
- [ ] Copy function code from guide
- [ ] Test functions locally (optional)

### Phase 4: Environment Configuration

- [ ] Set Firebase Functions config with Stripe keys
- [ ] Update `.env` with `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Update `.env.example` with placeholder

### Phase 5: Webhook Setup

- [ ] Deploy functions first
- [ ] Get Cloud Function URL
- [ ] Add webhook in Stripe Dashboard
- [ ] Select required events
- [ ] Copy webhook secret
- [ ] Update Firebase config with webhook secret
- [ ] Redeploy functions

### Phase 6: Security

- [ ] Update Firestore rules
- [ ] Deploy rules
- [ ] Test subscription access
- [ ] Test transaction logging
- [ ] Verify users can't write subscriptions

### Phase 7: Client Integration

- [ ] Update Premium.jsx with Stripe code
- [ ] Test checkout flow
- [ ] Test success redirect
- [ ] Test cancel redirect
- [ ] Verify premium status updates

### Phase 8: Testing

- [ ] Test with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify subscription created in Firestore
- [ ] Check transaction logged
- [ ] Test subscription cancellation
- [ ] Test failed payment handling

---

## 🔑 Environment Variables

### `.env` (Local - DO NOT COMMIT)

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
```

### Firebase Functions Config (Server-side)

```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_51xxxxx" \
  stripe.webhook_secret="whsec_xxxxx" \
  stripe.price_id="price_xxxxx"
```

---

## 🧪 Test Cards

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | 3D Secure required |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

---

## 📊 Firestore Collections

### `subscriptions/{userId}`

```javascript
{
  stripeSubscriptionId: "sub_xxxxx",
  stripeCustomerId: "cus_xxxxx",
  status: "active", // active, canceled, past_due
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  cancelAtPeriodEnd: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `transactions/{transactionId}`

```javascript
{
  userId: "user_id",
  type: "subscription_created", // or payment_succeeded, payment_failed
  stripeSubscriptionId: "sub_xxxxx",
  stripeInvoiceId: "in_xxxxx", // for payments
  amount: 4.99,
  currency: "usd",
  status: "succeeded", // or failed
  createdAt: Timestamp
}
```

---

## 🔒 Security Features

### ✅ Implemented

1. **Server-side verification** - All payments verified by Cloud Functions
2. **Firestore security rules** - Users can only read their own data
3. **Webhook signature verification** - Prevents fake webhook calls
4. **Transaction logging** - Complete audit trail
5. **Metadata tracking** - Firebase UID linked to Stripe customer

### ✅ Protected Against

- URL parameter manipulation
- Client-side subscription status changes
- Unauthorized access to subscription data
- Fake payment confirmations
- Replay attacks

---

## 💰 Pricing Recommendations

### Suggested Tiers

**Monthly:**
- $4.99/month - Good starting point
- Competitive with similar apps
- Low barrier to entry

**Yearly (Future):**
- $49.99/year (save $10)
- Better customer retention
- Predictable revenue

### Stripe Fees

- **2.9% + $0.30** per successful charge
- For $4.99: You receive **$4.54** (fee: $0.45)
- For $49.99: You receive **$48.04** (fee: $1.95)

---

## 🐛 Troubleshooting

### Issue: "Function not found"

**Solution:**
```bash
firebase deploy --only functions
```

### Issue: "Webhook signature verification failed"

**Solution:**
1. Check webhook secret is correct
2. Redeploy functions after updating config
3. Verify webhook URL matches deployed function

### Issue: "Subscription not updating in Firestore"

**Solution:**
1. Check Cloud Function logs: `firebase functions:log`
2. Verify webhook is receiving events
3. Check Firestore rules allow function writes

### Issue: "Payment succeeds but user not premium"

**Solution:**
1. Check `subscriptions/{userId}` document exists
2. Verify `currentPeriodEnd` is in future
3. Check client is reading from Firestore, not localStorage

---

## 📈 Monitoring

### Stripe Dashboard

- Monitor successful payments
- Track failed payments
- View customer subscriptions
- Check webhook delivery

### Firebase Console

- Monitor Cloud Function executions
- Check function logs for errors
- View Firestore subscription documents
- Track transaction logs

### Recommended Alerts

1. **Failed payments** - Email when payment fails
2. **Webhook failures** - Alert on webhook errors
3. **Subscription cancellations** - Track churn rate
4. **Function errors** - Monitor Cloud Function failures

---

## 🚀 Going to Production

### Before Launch

- [ ] Switch to Stripe live keys
- [ ] Update webhook to production URL
- [ ] Test with real card (small amount)
- [ ] Set up Stripe email receipts
- [ ] Configure invoice settings
- [ ] Add terms of service link
- [ ] Add privacy policy link
- [ ] Test subscription cancellation flow

### Production Checklist

- [ ] All test keys replaced with live keys
- [ ] Webhook configured for production
- [ ] Firestore rules deployed
- [ ] Functions deployed to production
- [ ] Error monitoring enabled
- [ ] Customer support email configured
- [ ] Refund policy documented

---

## 📞 Support Resources

### Stripe

- **Documentation:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Support:** https://support.stripe.com

### Firebase

- **Functions Docs:** https://firebase.google.com/docs/functions
- **Firestore Docs:** https://firebase.google.com/docs/firestore
- **Support:** https://firebase.google.com/support

---

## 🎯 Next Steps

1. **Read** `STRIPE_IMPLEMENTATION_GUIDE.md` for detailed code
2. **Follow** the 5-step Quick Start above
3. **Test** with Stripe test cards
4. **Deploy** to production when ready

---

**Estimated Setup Time:** 30-45 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** Firebase project, Stripe account

**Status:** Ready to implement! 🚀
