import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import TutorialStep from "./TutorialStep";
import onboardingManager from "../utils/onboardingManager";
import tutorialSteps from "../config/tutorialSteps";

const OnboardingOverlay = ({
  isActive = false,
  onComplete,
  onSkip,
  startStep = 0
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(startStep);
  const [isVisible, setIsVisible] = useState(isActive);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize onboarding manager with total steps
  useEffect(() => {
    onboardingManager.setTotalSteps(tutorialSteps.length);
  }, []);

  // Detect mobile device and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update visibility when isActive prop changes
  useEffect(() => {
    setIsVisible(isActive);
    if (isActive) {
      setCurrentStep(startStep);
      onboardingManager.setCurrentStep(startStep);
    }
  }, [isActive, startStep]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onboardingManager.setCurrentStep(nextStep);
    } else {
      // Last step - complete tutorial
      handleComplete();
    }
  }, [currentStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onboardingManager.setCurrentStep(prevStep);
    }
  }, [currentStep]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      // Prevent default behavior for navigation keys
      if (["ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "Escape":
          handleSkipTutorial();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleNext, handlePrevious]);

  // Handle skip entire tutorial
  const handleSkipTutorial = () => {
    onboardingManager.markSkipped();
    setIsVisible(false);
    if (onSkip) {
      onSkip();
    }
  };

  // Handle tutorial completion
  const handleComplete = () => {
    onboardingManager.markCompleted();
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const currentStepData = tutorialSteps[currentStep];

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        role="presentation"
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 9997,
          pointerEvents: "auto"
        }}
        onClick={(e) => {
          // Prevent clicks on backdrop from closing tutorial
          e.stopPropagation();
        }}
      />

      {/* Progress indicator bar */}
      <div
        role="progressbar"
        aria-label={t("onboarding_progress_label")}
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={tutorialSteps.length}
        aria-valuetext={t("onboarding_progress", { current: currentStep + 1, total: tutorialSteps.length })}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: isMobile ? "3px" : "4px",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          zIndex: 10000
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#007bff",
            width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
            transition: "width 0.3s ease"
          }}
        />
      </div>

      {/* Skip tutorial button */}
      <button
        onClick={handleSkipTutorial}
        aria-label={t("onboarding_skip_tutorial_aria")}
        style={{
          position: "fixed",
          top: isMobile ? "0.5rem" : "1rem",
          left: isMobile ? "0.5rem" : "1rem",
          padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          color: "#6c757d",
          border: "1px solid #dee2e6",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: isMobile ? "0.85rem" : "0.9rem",
          fontWeight: "500",
          zIndex: 10000,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          touchAction: "manipulation",
          minHeight: isMobile ? "44px" : "auto",
          minWidth: isMobile ? "44px" : "auto"
        }}
      >
        {t("onboarding_skip_tutorial")}
      </button>

      {/* Current tutorial step */}
      <TutorialStep
        stepNumber={currentStep}
        titleKey={currentStepData.titleKey}
        descriptionKey={currentStepData.descriptionKey}
        targetSelector={currentStepData.targetSelector}
        position={currentStepData.position}
        onNext={handleNext}
        onSkip={handleSkipTutorial}
        onPrevious={handlePrevious}
        isFirst={currentStep === 0}
        isLast={currentStep === tutorialSteps.length - 1}
        totalSteps={tutorialSteps.length}
        isMobile={isMobile}
      />
    </>
  );
};

export default OnboardingOverlay;
