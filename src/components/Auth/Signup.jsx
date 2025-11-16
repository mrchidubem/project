import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { Button, Card, Input, Alert } from "../ui";
import authService from "../../utils/authService";
import LanguageSwitcher from "../LanguageSwitcher";
import "./Auth.css";

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError(t("auth_fill_all_fields"));
      return false;
    }

    if (password.length < 6) {
      setError(t("auth_password_too_short"));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t("auth_passwords_dont_match"));
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await authService.signUp(email, password);
      
      if (result.emailVerificationSent) {
        setSuccess(t("auth_verification_email_sent"));
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || t("auth_signup_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    
    try {
      await authService.signInWithGoogle(true);
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || t("auth_google_signup_failed"));
      }
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
          <h1 className="auth-title">{t("auth_signup")}</h1>
          <p className="auth-subtitle">Create your MedAdhere account</p>
        </div>

        <Card className="auth-card">
          {error && (
            <Alert variant="error" className="auth-alert">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="auth-alert">
              {success}
            </Alert>
          )}

          <form onSubmit={handleEmailSignup} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t("auth_email")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth_email_placeholder")}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("auth_password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth_password_placeholder")}
                disabled={loading}
              />
              <p className="form-helper-text">{t("auth_password_requirements")}</p>
            </div>

            <div className="form-group">
              <label className="form-label">{t("auth_confirm_password")}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth_confirm_password_placeholder")}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {t("auth_signup")}
            </Button>
          </form>

          <div className="auth-divider">
            <span>{t("auth_or")}</span>
          </div>

          <Button
            onClick={handleGoogleSignup}
            variant="secondary"
            fullWidth
            disabled={loading}
            iconLeft={<FcGoogle size={20} />}
          >
            {t("auth_google_signup")}
          </Button>

          <div className="auth-footer">
            <p className="auth-footer-text">
              {t("auth_have_account")}{" "}
              <Link to="/" className="auth-link">
                {t("auth_login")}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
