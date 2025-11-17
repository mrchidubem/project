import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Alert } from "../components/ui";
import "./MockCheckout.css";

const MockCheckout = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Test card number
  const TEST_CARD = "4242424242424242";

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setExpiry(formatExpiry(value));
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setCvc(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validate card number
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard !== TEST_CARD) {
      setError("Card declined. Please use test card: 4242 4242 4242 4242");
      setProcessing(false);
      return;
    }

    // Validate expiry
    if (!expiry || expiry.length < 5) {
      setError("Invalid expiry date");
      setProcessing(false);
      return;
    }

    // Validate CVC
    if (!cvc || cvc.length < 3) {
      setError("Invalid CVC");
      setProcessing(false);
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError("Cardholder name is required");
      setProcessing(false);
      return;
    }

    // Success - redirect to premium page with success flag
    navigate("/premium?success=true");
  };

  const handleCancel = () => {
    navigate("/premium?canceled=true");
  };

  return (
    <div className="mock-checkout">
      <div className="mock-checkout__container">
        <div className="mock-checkout__header">
          <div className="mock-checkout__logo">
            <svg width="60" height="26" viewBox="0 0 60 26" fill="none">
              <rect width="60" height="26" rx="4" fill="#635BFF"/>
              <text x="30" y="18" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">stripe</text>
            </svg>
          </div>
          <div className="mock-checkout__secure">
            🔒 Secure checkout
          </div>
        </div>

        <Card className="mock-checkout__card">
          <div className="mock-checkout__summary">
            <h2>MedAdhere Premium</h2>
            <div className="mock-checkout__price">
              <span className="amount">$4.99</span>
              <span className="period">/month</span>
            </div>
            <p className="mock-checkout__description">
              Unlimited medications and ADR reports
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mock-checkout__form">
            {error && (
              <Alert variant="error" style={{ marginBottom: "1rem" }}>
                {error}
              </Alert>
            )}

            <Alert variant="info" style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
              💳 Test Mode: Use card <strong>4242 4242 4242 4242</strong>
            </Alert>

            <div className="form-group">
              <label htmlFor="cardNumber">Card number</label>
              <Input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4242 4242 4242 4242"
                required
                disabled={processing}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiry">Expiry</label>
                <Input
                  id="expiry"
                  type="text"
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  required
                  disabled={processing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cvc">CVC</label>
                <Input
                  id="cvc"
                  type="text"
                  value={cvc}
                  onChange={handleCvcChange}
                  placeholder="123"
                  required
                  disabled={processing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Cardholder name</label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={processing}
              />
            </div>

            <div className="mock-checkout__actions">
              <Button
                type="submit"
                variant="primary"
                loading={processing}
                disabled={processing}
                style={{ width: "100%" }}
              >
                {processing ? "Processing..." : "Pay $4.99"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={processing}
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                Cancel
              </Button>
            </div>

            <div className="mock-checkout__footer">
              <p>Powered by <strong>Stripe</strong></p>
              <p className="mock-checkout__test-notice">
                🧪 This is a test environment. No real charges will be made.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default MockCheckout;
