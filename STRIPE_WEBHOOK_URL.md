# 🔗 Stripe Webhook Endpoint URL

## Your Webhook URL

Based on your Firebase project `medadhere-bab59`, your webhook endpoint URL will be:

```
https://us-central1-medadhere-bab59.cloudfunctions.net/stripeWebhook
```

**Note:** The region (`us-central1`) is the default. If you deployed to a different region, replace it accordingly.

---

## 📋 How to Set Up the Webhook in Stripe

### Step 1: Go to Stripe Dashboard

1. Log in to https://dashboard.stripe.com
2. Click **Developers** in the left sidebar
3. Click **Webhooks**

### Step 2: Add Endpoint

1. Click **Add endpoint** button
2. **Endpoint URL:** Paste your URL:
   ```
   https://us-central1-medadhere-bab59.cloudfunctions.net/stripeWebhook
   ```

### Step 3: Select Events

Select these events to listen to:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 4: Get Signing Secret

1. After creating the webhook, click on it
2. Click **Reveal** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Save it - you'll need it for Firebase Functions config

---

## 🔧 Configure Firebase Functions

After getting your webhook secret, run:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_your_secret_here"
```

Then redeploy:

```bash
firebase deploy --only functions
```

---

## ✅ Verify Webhook is Working

### Test the Webhook

1. In Stripe Dashboard → Webhooks
2. Click on your webhook
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Click **Send test webhook**

### Check Firebase Logs

```bash
firebase functions:log --only stripeWebhook
```

You should see log entries showing the webhook was received.

---

## 🌍 Region Options

If you want to deploy to a different region, you can specify it in your Cloud Function:

**Common Regions:**
- `us-central1` (Iowa, USA) - Default
- `us-east1` (South Carolina, USA)
- `europe-west1` (Belgium)
- `asia-east1` (Taiwan)

**To change region**, update your function deployment:

```javascript
// In functions/index.js
exports.stripeWebhook = functions
  .region('europe-west1') // Specify region here
  .https.onRequest(async (req, res) => {
    // ... webhook code
  });
```

Then your URL would be:
```
https://europe-west1-medadhere-bab59.cloudfunctions.net/stripeWebhook
```

---

## 🔒 Security Notes

1. **Never share your webhook secret** - It's like a password
2. **Always verify webhook signatures** - The code provided does this
3. **Use HTTPS only** - Firebase Functions use HTTPS by default
4. **Monitor webhook failures** - Check Stripe Dashboard regularly

---

## 🐛 Troubleshooting

### Webhook Returns 404

**Problem:** Function not deployed or wrong URL

**Solution:**
```bash
# Check if function is deployed
firebase functions:list

# Redeploy if needed
firebase deploy --only functions
```

### Webhook Returns 500

**Problem:** Error in function code

**Solution:**
```bash
# Check logs
firebase functions:log --only stripeWebhook

# Look for error messages
```

### Signature Verification Failed

**Problem:** Wrong webhook secret

**Solution:**
```bash
# Update webhook secret
firebase functions:config:set stripe.webhook_secret="whsec_correct_secret"

# Redeploy
firebase deploy --only functions
```

---

## 📝 Quick Reference

**Your Project:** `medadhere-bab59`

**Webhook URL:**
```
https://us-central1-medadhere-bab59.cloudfunctions.net/stripeWebhook
```

**Required Events:**
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

**Next Steps:**
1. ✅ Copy webhook URL above
2. ✅ Add to Stripe Dashboard
3. ✅ Select events
4. ✅ Copy webhook secret
5. ✅ Configure Firebase Functions
6. ✅ Redeploy functions
7. ✅ Test webhook

---

**Last Updated:** November 17, 2025  
**Project:** medadhere-bab59  
**Status:** Ready to configure
