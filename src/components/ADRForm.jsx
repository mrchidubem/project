import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Input, Alert, Badge, ProgressBar, Button } from "./ui";
import { queueAction, syncQueuedActions } from "../utils/offlineQueue";
import usageLimiter from "../utils/usageLimiter.js";
import "./ADRForm.css";

const ADRForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    medicineName: "",
    symptoms: "",
    severity: "mild",
    dateOccurred: "",
    file: null,
  });
  const [errors, setErrors] = useState({});
  const [adrReports, setAdrReports] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalSteps = 3;

  // Load ADR data and usage stats
  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem("adrReports")) || [];
    const stats = usageLimiter.getUsageStats();
    setAdrReports(savedReports);
    setUsageStats(stats);
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem("adrReports", JSON.stringify(adrReports));
  }, [adrReports]);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      console.log("🔁 Back online — syncing queued ADR reports...");
      syncQueuedActions();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Handle field change with validation
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.medicineName.trim()) {
        newErrors.medicineName = "Medicine name is required";
      }
      if (!formData.dateOccurred) {
        newErrors.dateOccurred = "Date is required";
      }
    }

    if (step === 2) {
      if (!formData.symptoms.trim()) {
        newErrors.symptoms = "Please describe the symptoms";
      }
      if (formData.symptoms.trim().length < 10) {
        newErrors.symptoms = "Please provide more details (at least 10 characters)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit ADR form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    // Check usage limits
    if (!usageLimiter.canAddADR()) {
      alert(t('free_limit_reached'));
      navigate("/premium");
      return;
    }

    setIsSubmitting(true);

    const newReport = {
      id: Date.now(),
      medicineName: formData.medicineName,
      symptoms: formData.symptoms,
      severity: formData.severity,
      dateOccurred: formData.dateOccurred,
      file: formData.file ? formData.file.name : null,
      dateSubmitted: new Date().toLocaleString(),
    };

    const payload = { type: "adr", data: newReport, timestamp: Date.now() };

    try {
      if (!navigator.onLine) {
        await queueAction(payload);
        alert(t('offline_saved'));
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setAdrReports([...adrReports, newReport]);
      usageLimiter.incrementADRCount();
      setUsageStats(usageLimiter.getUsageStats());
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setFormData({
        medicineName: "",
        symptoms: "",
        severity: "mild",
        dateOccurred: "",
        file: null,
      });
      setCurrentStep(1);
      setErrors({});
    } catch (err) {
      console.error("ADR submission error:", err);
      alert(t('submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReport = (id) => {
    if (!confirm("Delete this ADR report?")) return;
    
    const filtered = adrReports.filter((r) => r.id !== id);
    setAdrReports(filtered);
    usageLimiter.decrementADRCount();
    setUsageStats(usageLimiter.getUsageStats());
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "mild": return "success";
      case "moderate": return "warning";
      case "severe": return "error";
      default: return "info";
    }
  };

  if (!usageStats) {
    return <div className="adr-form__loading">{t('loading')}</div>;
  }

  return (
    <div className="adr-form">
      {/* Header */}
      <div className="adr-form__header">
        <h1 className="adr-form__title">Report Adverse Drug Reaction</h1>
        <p className="adr-form__subtitle">
          Help us track medication side effects and improve patient safety
        </p>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <Alert variant="success" className="adr-form__success">
          ✅ ADR report submitted successfully!
        </Alert>
      )}

      {/* Usage Stats */}
      {!usageStats.isPremium && (
        <div className="usage-stats">
          <div className="usage-stats__content">
            <span className="usage-stats__label">Free plan usage:</span>
            <span className="usage-stats__value">
              {usageStats.adrCount}/{usageStats.adrLimit} {t('adr_reports')}
            </span>
          </div>
          <ProgressBar 
            value={usageStats.adrCount} 
            max={usageStats.adrLimit}
            variant={usageStats.adrCount >= usageStats.adrLimit ? "warning" : "primary"}
          />
        </div>
      )}

      {/* Limit Warning */}
      {!usageStats.isPremium && usageStats.adrCount >= usageStats.adrLimit && (
        <Alert variant="warning" className="adr-form__warning">
          <strong>⚠️ Limit Reached</strong>
          <p>You've reached your free plan limit ({usageStats.adrLimit} ADR reports).</p>
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate("/premium")}
          >
            {t('upgrade_now')}
          </Button>
        </Alert>
      )}

      {/* Step Indicator */}
      <div className="step-indicator">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`step-indicator__step ${
              step === currentStep ? "step-indicator__step--active" : ""
            } ${step < currentStep ? "step-indicator__step--completed" : ""}`}
          >
            <div className="step-indicator__circle">
              {step < currentStep ? "✓" : step}
            </div>
            <div className="step-indicator__label">
              {step === 1 && "Medication Info"}
              {step === 2 && "Symptoms"}
              {step === 3 && "Review & Submit"}
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="adr-form__form">
        {/* Step 1: Medication Information */}
        {currentStep === 1 && (
          <Card className="form-section">
            
              <div className="form-section__header">
                <div className="form-section__icon">💊</div>
                <div>
                  <h3 className="form-section__title">Medication Information</h3>
                  <p className="form-section__description">
                    Tell us about the medication that caused the reaction
                  </p>
                </div>
              </div>

              <div className="form-section__body">
                <div className="form-field">
                  <label className="form-field__label">
                    <span className="form-field__icon">💊</span>
                    Medicine Name *
                  </label>
                  <Input
                    type="text"
                    name="medicineName"
                    value={formData.medicineName}
                    onChange={handleChange}
                    placeholder="Enter medicine name"
                    error={errors.medicineName}
                  />
                  {errors.medicineName && (
                    <span className="form-field__error">{errors.medicineName}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-field__label">
                    <span className="form-field__icon">📅</span>
                    When did it occur? *
                  </label>
                  <Input
                    type="date"
                    name="dateOccurred"
                    value={formData.dateOccurred}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    error={errors.dateOccurred}
                  />
                  {errors.dateOccurred && (
                    <span className="form-field__error">{errors.dateOccurred}</span>
                  )}
                </div>
              </div>

              <div className="form-section__actions">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                >
                  Next: Describe Symptoms →
                </Button>
              </div>
            
          </Card>
        )}

        {/* Step 2: Symptoms */}
        {currentStep === 2 && (
          <Card className="form-section">
            
              <div className="form-section__header">
                <div className="form-section__icon">🩺</div>
                <div>
                  <h3 className="form-section__title">Symptoms & Severity</h3>
                  <p className="form-section__description">
                    Describe the reaction and its severity
                  </p>
                </div>
              </div>

              <div className="form-section__body">
                <div className="form-field">
                  <label className="form-field__label">
                    <span className="form-field__icon">📝</span>
                    Describe Symptoms *
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    placeholder="Describe the side effects or reactions in detail..."
                    className={`form-field__textarea ${errors.symptoms ? "form-field__textarea--error" : ""}`}
                    rows="5"
                  />
                  {errors.symptoms && (
                    <span className="form-field__error">{errors.symptoms}</span>
                  )}
                  <span className="form-field__hint">
                    {formData.symptoms.length} characters (minimum 10)
                  </span>
                </div>

                <div className="form-field">
                  <label className="form-field__label">
                    <span className="form-field__icon">⚠️</span>
                    Severity Level
                  </label>
                  <div className="severity-options">
                    <label className={`severity-option ${formData.severity === "mild" ? "severity-option--active" : ""}`}>
                      <input
                        type="radio"
                        name="severity"
                        value="mild"
                        checked={formData.severity === "mild"}
                        onChange={handleChange}
                      />
                      <span className="severity-option__label">Mild</span>
                      <span className="severity-option__description">Minor discomfort</span>
                    </label>

                    <label className={`severity-option ${formData.severity === "moderate" ? "severity-option--active" : ""}`}>
                      <input
                        type="radio"
                        name="severity"
                        value="moderate"
                        checked={formData.severity === "moderate"}
                        onChange={handleChange}
                      />
                      <span className="severity-option__label">Moderate</span>
                      <span className="severity-option__description">Noticeable effects</span>
                    </label>

                    <label className={`severity-option ${formData.severity === "severe" ? "severity-option--active" : ""}`}>
                      <input
                        type="radio"
                        name="severity"
                        value="severe"
                        checked={formData.severity === "severe"}
                        onChange={handleChange}
                      />
                      <span className="severity-option__label">Severe</span>
                      <span className="severity-option__description">Serious reaction</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                >
                  ← Previous
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                >
                  Next: Review →
                </Button>
              </div>
            
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <Card className="form-section">
            
              <div className="form-section__header">
                <div className="form-section__icon">✅</div>
                <div>
                  <h3 className="form-section__title">Review & Submit</h3>
                  <p className="form-section__description">
                    Please review your report before submitting
                  </p>
                </div>
              </div>

              <div className="form-section__body">
                <div className="review-section">
                  <div className="review-item">
                    <span className="review-item__label">Medicine Name:</span>
                    <span className="review-item__value">{formData.medicineName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-item__label">Date Occurred:</span>
                    <span className="review-item__value">{formData.dateOccurred}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-item__label">Severity:</span>
                    <Badge variant={getSeverityColor(formData.severity)}>
                      {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                    </Badge>
                  </div>
                  <div className="review-item review-item--full">
                    <span className="review-item__label">Symptoms:</span>
                    <span className="review-item__value">{formData.symptoms}</span>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-field__label">
                    <span className="form-field__icon">📎</span>
                    Attach Image/Document (Optional)
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleChange}
                    className="form-field__file"
                  />
                  {formData.file && (
                    <span className="form-field__hint">
                      Selected: {formData.file.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-section__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                >
                  ← Previous
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit ADR Report"}
                </Button>
              </div>
            
          </Card>
        )}
      </form>

      {/* Submitted Reports */}
      <div className="adr-reports">
        <h2 className="adr-reports__title">📋 Submitted ADR Reports</h2>
        
        {adrReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <h3 className="empty-state__title">No ADR reports yet</h3>
            <p className="empty-state__description">
              Your submitted reports will appear here
            </p>
          </div>
        ) : (
          <div className="adr-reports__list">
            {adrReports.map((report) => (
              <Card key={report.id} className="adr-report-card">
                
                  <div className="adr-report-card__header">
                    <div>
                      <h3 className="adr-report-card__medicine">{report.medicineName}</h3>
                      <p className="adr-report-card__date">📅 {report.dateSubmitted}</p>
                    </div>
                    <Badge variant={getSeverityColor(report.severity)}>
                      {report.severity}
                    </Badge>
                  </div>

                  <div className="adr-report-card__body">
                    <p className="adr-report-card__symptoms">{report.symptoms}</p>
                    {report.file && (
                      <p className="adr-report-card__attachment">
                        📎 Attachment: {report.file}
                      </p>
                    )}
                  </div>

                  <div className="adr-report-card__actions">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => deleteReport(report.id)}
                    >
                      Delete
                    </Button>
                  </div>
                
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ADRForm;
