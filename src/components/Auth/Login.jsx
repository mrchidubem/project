import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { Button, Card, Input, Checkbox, Alert } from "../ui";
import authService from "../../utils/authService";
import LanguageSwitcher from "../LanguageSwitcher";
import "./Auth.css";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError(t("auth_fill_all_fields"));
      return;
    }

    setLoading(true);
    
    try {
      await authService.signIn(email, password, rememberMe);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || t("auth_login_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      await authService.signInWithGoogle(rememberMe);
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || t("auth_google_login_failed"));
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
          <h1 className="auth-title">{t("auth_login")}</h1>
          <p className="auth-subtitle">Welcome back to MedAdhere</p>
        </div>

        <Card className="auth-card">
          {error && (
            <Alert variant="error" className="auth-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleEmailLogin} className="auth-form">
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
            </div>

            <div className="form-row">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                label={t("auth_remember_me")}
              />
              <Link to="/password-reset" className="auth-link">
                {t("auth_forgot_password")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {t("auth_login")}
            </Button>
          </form>

          <div className="auth-divider">
            <span>{t("auth_or")}</span>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="secondary"
            fullWidth
            disabled={loading}
            iconLeft={<FcGoogle size={20} />}
          >
            {t("auth_google_login")}
          </Button>

          <div className="auth-footer">
            <p className="auth-footer-text">
              {t("auth_no_account")}{" "}
              <Link to="/signup" className="auth-link">
                {t("auth_signup")}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
