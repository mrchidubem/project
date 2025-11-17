import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import { Button, Card, Alert } from "../ui";
import usageLimiter from "../utils/usageLimiter.js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Premium = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);
  }, []);

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      // Redirect to Stripe Checkout (client-side)
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/premium?success=true`,
        cancelUrl: `${window.location.origin}/premium?canceled=true`,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!usageStats) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>{t('loading')}</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>🌟 {t('upgrade_to_premium')}</h1>

      {error && <Alert variant="error" style={{ marginBottom: "1rem" }}>{error}</Alert>}

      <Card style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>{t('your_current_usage')}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span>{t('medications')}:</span>
          <strong>{usageStats.medicationCount} / {usageStats.medicationLimit || '∞'}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t('adr_reports')}:</span>
          <strong>{usageStats.adrCount} / {usageStats.adrLimit || '∞'}</strong>
        </div>
      </Card>

      {usageStats.isPremium ? (
        <Card style={{ padding: "1.5rem", backgroundColor: "#d4edda", border: "1px solid #c3e6cb" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#155724" }}>🎉 {t('youre_premium')}</h3>
          <p style={{ margin: 0, color: "#155724" }}>{t('enjoy_unlimited')}</p>
        </Card>
      ) : (
        <>
          <Card style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>Premium Benefits</h3>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              <li>Unlimited medications</li>
              <li>Unlimited ADR reports</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
            </ul>
          </Card>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: "1rem 0" }}>$4.99/month</h2>
            <Button
              onClick={handleStripeCheckout}
              variant="primary"
              loading={loading}
              disabled={loading}
              style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}
            >
              Subscribe with Stripe
            </Button>
            <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
              Secure checkout powered by Stripe
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Premium;
