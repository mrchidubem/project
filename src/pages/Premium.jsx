import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import usageLimiter from "../utils/usageLimiter.js";
import onboardingManager from "../utils/onboardingManager.js";

const Premium = () => {
  const { t } = useTranslation();
  const [usageStats, setUsageStats] = useState(null);
  const [searchParams] = useSearchParams();

  const handleStartTutorial = () => {
    onboardingManager.startManualTutorial();
    // Dispatch custom event to trigger onboarding without page reload
    window.dispatchEvent(new CustomEvent('restartOnboarding'));
  };

  useEffect(() => {
    // Check for Paystack success callback
    const paymentStatus = searchParams.get('status');
    const reference = searchParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      handlePaystackSuccess(reference);
    }
    
    // Load usage statistics when component mounts
    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);
  }, [searchParams]);

  const handlePayment = () => {
    // Simulate Paystack test checkout with return URL
    const returnUrl = `${window.location.origin}/premium?status=success&reference=test_${Date.now()}`;
    window.location.href = `https://paystack.com/pay/testcheckout?callback_url=${encodeURIComponent(returnUrl)}`;
  };

  /**
   * Handle successful Paystack payment callback
   * - Update premium status in usageLimiter
   * - Clear usage limitations for newly premium users
   * - Preserve existing data during status transitions
   */
  const handlePaystackSuccess = (reference) => {
    try {
      // Set premium status with 30-day expiry (monthly subscription)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      // Update premium status - this preserves existing medication/ADR data
      usageLimiter.setPremiumStatus(expiryDate);
      
      // Refresh usage stats to reflect premium status
      const updatedStats = usageLimiter.getUsageStats();
      setUsageStats(updatedStats);
      
      console.log("Paystack payment successful - premium status updated", { reference });
      
      // Show success message
      alert(t('payment_successful'));
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } catch (err) {
      console.error("Failed to update premium status after Paystack success:", err);
      alert(t('payment_issue'));
    }
  };

  if (!usageStats) {
    return <div style={{ padding: "1rem", textAlign: "center" }}>{t('loading')}</div>;
  }

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>{t('upgrade_to_premium')} 🌟</h2>
        <button
          onClick={handleStartTutorial}
          style={{
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}
          title={t('tutorial_help')}
        >
          {t('replay_tutorial')} 🎓
        </button>
      </div>
      
      {/* Usage Status Display */}
      <div style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "1rem",
        margin: "1rem 0",
        textAlign: "left"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#495057" }}>{t('your_current_usage')}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span>{t('medications')}:</span>
          <span style={{ fontWeight: "bold" }}>
            {usageStats.medicationCount}
            {usageStats.medicationLimit ? ` / ${usageStats.medicationLimit}` : ` (${t('unlimited')})`}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t('adr_reports')}:</span>
          <span style={{ fontWeight: "bold" }}>
            {usageStats.adrCount}
            {usageStats.adrLimit ? ` / ${usageStats.adrLimit}` : ` (${t('unlimited')})`}
          </span>
        </div>
        {!usageStats.isPremium && (
          <p style={{ 
            margin: "0.5rem 0 0 0", 
            fontSize: "0.9rem", 
            color: "#6c757d",
            fontStyle: "italic" 
          }}>
            {t('free_users_limited')}
          </p>
        )}
      </div>

      {/* Premium Benefits Messaging */}
      <div style={{ margin: "1rem 0" }}>
        <p>
          {t('unlock_unlimited')}
          {!usageStats.isPremium && ` ${t('track_health_needs')}`}!
        </p>
        <p style={{ color: "#6c757d", fontSize: "0.9rem" }}>
          {t('plus_cloud_sync')}
        </p>
      </div>

      {usageStats.isPremium ? (
        <div style={{
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "8px",
          padding: "1rem",
          color: "#155724"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>🎉 {t('youre_premium')}</h3>
          <p style={{ margin: 0 }}>
            {t('enjoy_unlimited')}
            {usageStats.premiumExpiry && (
              <span style={{ display: "block", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                {t('premium_expires')} {new Date(usageStats.premiumExpiry).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      ) : (
        <>
          <h3>₦2,500 / {t('monthly_subscription')}</h3>
          <button
            onClick={handlePayment}
            style={{
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            {t('pay_with_paystack')}
          </button>
          <p style={{ marginTop: "1rem", color: "#555" }}>
            {t('secure_checkout')} powered by Paystack.
          </p>
        </>
      )}
    </div>
  );
};

export default Premium;
