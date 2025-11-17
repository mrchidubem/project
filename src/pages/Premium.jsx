import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, Alert } from "../components/ui";
import usageLimiter from "../utils/usageLimiter.js";

const Premium = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);

    // Handle payment success/cancel from URL params
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
      // Set premium status (1 month subscription)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      usageLimiter.setPremiumStatus(expiryDate);
      
      // Update localStorage for backward compatibility
      localStorage.setItem("plan", "premium");
      
      // Clear URL params after 3 seconds
      setTimeout(() => {
        navigate('/premium', { replace: true });
      }, 3000);
    } else if (searchParams.get('canceled') === 'true') {
      setError("Payment was canceled. You can try again anytime.");
      setTimeout(() => {
        navigate('/premium', { replace: true });
      }, 3000);
    }
  }, [searchParams, navigate]);

  const handleStripeCheckout = () => {
    // Navigate to mock checkout page
    navigate('/checkout');
  };

  if (!usageStats) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>{t('loading')}</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>🌟 {t('upgrade_to_premium') || 'Upgrade to Premium'}</h1>

      {success && (
        <Alert variant="success" style={{ marginBottom: "1rem" }}>
          🎉 Payment successful! You're now a Premium member. Enjoy unlimited access!
        </Alert>
      )}

      {error && <Alert variant="error" style={{ marginBottom: "1rem" }}>{error}</Alert>}

      <Card style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>{t('your_current_usage') || 'Your Current Usage'}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span>{t('medications') || 'Medications'}:</span>
          <strong>{usageStats.medicationCount} / {usageStats.medicationLimit || '∞'}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t('adr_reports') || 'ADR Reports'}:</span>
          <strong>{usageStats.adrCount} / {usageStats.adrLimit || '∞'}</strong>
        </div>
      </Card>

      {usageStats.isPremium ? (
        <Card style={{ padding: "1.5rem", backgroundColor: "#d4edda", border: "1px solid #c3e6cb" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#155724" }}>
            🎉 {t('youre_premium') || "You're Premium!"}
          </h3>
          <p style={{ margin: "0 0 0.5rem 0", color: "#155724" }}>
            {t('enjoy_unlimited') || 'Enjoy unlimited medications and ADR reports!'}
          </p>
          {usageStats.premiumExpiry && (
            <p style={{ margin: 0, color: "#155724", fontSize: "0.9rem" }}>
              Expires: {new Date(usageStats.premiumExpiry).toLocaleDateString()}
            </p>
          )}
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            style={{ marginTop: "1rem" }}
          >
            Go to Dashboard
          </Button>
        </Card>
      ) : (
        <>
          <Card style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>Premium Benefits</h3>
            <ul style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>✅ Unlimited medications</li>
              <li>✅ Unlimited ADR reports</li>
              <li>✅ Priority support</li>
              <li>✅ Advanced analytics</li>
              <li>✅ No ads</li>
            </ul>
          </Card>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: "1rem 0", color: "var(--primary-500)" }}>$4.99/month</h2>
            <Button
              onClick={handleStripeCheckout}
              variant="primary"
              loading={loading}
              disabled={loading}
              style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}
            >
              {loading ? 'Processing...' : 'Subscribe with Stripe'}
            </Button>
            <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
              🔒 Secure checkout powered by Stripe
            </p>
            <p style={{ marginTop: "0.5rem", color: "#999", fontSize: "0.85rem" }}>
              Cancel anytime. No hidden fees.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Premium;
