import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, Input, Alert } from "../ui";
import authService from "../../utils/authService";
import LanguageSwitcher from "../LanguageSwitcher";
import "./Auth.css";

const PasswordReset = () => {
  const { t } = useTranslation();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError(t("auth_email_required"));
      return;
    }

    setLoading(true);
    
    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t("auth_password_reset_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Language Switcher */}
      <div className="auth-language-switcher">
        <LanguageSwitcher compact={true} />
      </div>

      <div className="auth-content">
        {/* Logo and Title */}
        <div className="auth-header">
          <div className="auth-logo">💊</div>
          <h1 className="auth-title">{t("auth_reset_password")}</h1>
          <p className="auth-subtitle">
            {success 
              ? t("auth_check_email") 
              : t("auth_reset_password_instructions")}
          </p>
        </div>

        <Card className="auth-card">
          {error && (
            <Alert variant="error" className="auth-alert">
              {error}
            </Alert>
          )}

          {success ? (
            <div className="auth-success">
              <div className="auth-success-icon">✅</div>
              <h3 className="auth-success-title">{t("auth_email_sent")}</h3>
              <p className="auth-success-text">
                {t("auth_password_reset_email_sent")}
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => window.location.href = "/"}
              >
                {t("auth_back_to_login")}
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handlePasswordReset} className="auth-form">
                <div className="form-group">
                  <label className="form-label">{t("auth_email")}</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth_email_placeholder")}
                    disabled={loading}
                  />
                  <p className="form-helper-text">
                    {t("auth_password_reset_helper")}
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {t("auth_send_reset_link")}
                </Button>
              </form>

              <div className="auth-footer">
                <p className="auth-footer-text">
                  {t("auth_remember_password")}{" "}
                  <Link to="/" className="auth-link">
                    {t("auth_back_to_login")}
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
