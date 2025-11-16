import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const TutorialStep = ({
  stepNumber,
  titleKey,
  descriptionKey,
  targetSelector = null,
  position = "center",
  onNext,
  onSkip,
  onPrevious,
  isFirst = false,
  isLast = false,
  totalSteps = 1,
  isMobile = false
}) => {
  const { t } = useTranslation();
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: "50%", left: "50%" });
  const [isElementVisible, setIsElementVisible] = useState(true);
  const tooltipRef = useRef(null);
  const nextButtonRef = useRef(null);
  const previousButtonRef = useRef(null);
  const skipButtonRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [focusableElements, setFocusableElements] = useState([]);

  useEffect(() => {
    if (targetSelector) {
      // Retry finding element with a small delay to handle dynamic content
      const findElement = () => {
        const element = document.querySelector(targetSelector);
        
        if (element) {
          setTargetElement(element);
          setIsElementVisible(true);
          
          // Calculate tooltip position based on target element
          const rect = element.getBoundingClientRect();
          calculatePosition(rect, position);
          
          // Scroll element into view if off-screen
          const isOffScreen = rect.top < 0 || rect.bottom > window.innerHeight || 
                             rect.left < 0 || rect.right > window.innerWidth;
          
          if (isOffScreen) {
            element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            
            // Recalculate position after scroll
            setTimeout(() => {
              const newRect = element.getBoundingClientRect();
              calculatePosition(newRect, position);
            }, 300);
          }
        } else {
          // Element not found - fallback to center position
          console.warn(`Tutorial target element not found: ${targetSelector}`);
          setTargetElement(null);
          setIsElementVisible(false);
          setTooltipPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
        }
      };
      
      // Try immediately and with a small delay for dynamic content
      findElement();
      const timeoutId = setTimeout(findElement, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Center position for steps without target
      setTargetElement(null);
      setIsElementVisible(true);
      setTooltipPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
    }
  }, [targetSelector, position, isMobile]);

  // Focus management and focus trapping for accessibility
  useEffect(() => {
    // Focus the next button when step changes
    if (nextButtonRef.current) {
      nextButtonRef.current.focus();
    }

    // Collect all focusable elements within the tooltip
    if (tooltipRef.current) {
      const focusable = Array.from(
        tooltipRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      setFocusableElements(focusable);
    }
  }, [stepNumber]);

  // Focus trap - keep focus within the tutorial dialog
  useEffect(() => {
    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [focusableElements]);

  // Handle window resize to recalculate positions
  useEffect(() => {
    if (!targetElement) return;
    
    const handleResize = () => {
      const rect = targetElement.getBoundingClientRect();
      calculatePosition(rect, position);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [targetElement, position]);

  const calculatePosition = (rect, pos) => {
    const offset = isMobile ? 10 : 20; // Spacing from target element
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 350) : 450; // Max width of tooltip (increased for better text display)
    const tooltipEstimatedHeight = 280; // Estimated height for positioning calculations
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = isMobile ? 16 : 24; // Padding from viewport edges
    
    let calculatedPosition = {};
    let finalPosition = pos;
    
    // Check available space in all directions
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;
    
    // For mobile or when target element is large, prefer center positioning
    if (isMobile || rect.height > viewportHeight * 0.5) {
      calculatedPosition = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      };
      setTooltipPosition(calculatedPosition);
      return;
    }
    
    switch (pos) {
      case "top":
        // Check if there's enough space above
        if (spaceAbove >= tooltipEstimatedHeight + offset + padding) {
          calculatedPosition = {
            top: `${rect.top - offset}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: "translate(-50%, -100%)"
          };
        } 
        // Try right side if there's space
        else if (spaceRight >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${Math.max(padding, rect.top)}px`,
            left: `${rect.right + offset}px`,
            transform: "translate(0, 0)"
          };
          finalPosition = "right";
        }
        // Try left side if there's space
        else if (spaceLeft >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${Math.max(padding, rect.top)}px`,
            left: `${rect.left - offset}px`,
            transform: "translate(-100%, 0)"
          };
          finalPosition = "left";
        }
        // Fallback to center
        else {
          calculatedPosition = {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          };
          finalPosition = "center";
        }
        break;
        
      case "bottom":
        // Check if there's enough space below
        if (spaceBelow >= tooltipEstimatedHeight + offset + padding) {
          calculatedPosition = {
            top: `${rect.bottom + offset}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: "translate(-50%, 0)"
          };
        }
        // Try right side if there's space
        else if (spaceRight >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${Math.max(padding, rect.top)}px`,
            left: `${rect.right + offset}px`,
            transform: "translate(0, 0)"
          };
          finalPosition = "right";
        }
        // Try left side if there's space
        else if (spaceLeft >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${Math.max(padding, rect.top)}px`,
            left: `${rect.left - offset}px`,
            transform: "translate(-100%, 0)"
          };
          finalPosition = "left";
        }
        // Fallback to center
        else {
          calculatedPosition = {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          };
          finalPosition = "center";
        }
        break;
        
      case "left":
        // Check if there's enough space on the left
        if (spaceLeft >= tooltipWidth + offset + padding) {
          // Calculate vertical position - prefer aligning with target, but ensure it stays in viewport
          let topPos = rect.top + rect.height / 2;
          
          // If centering would push tooltip above viewport, align to top with padding
          if (topPos - tooltipEstimatedHeight / 2 < padding) {
            topPos = padding + tooltipEstimatedHeight / 2;
          }
          
          // If tooltip would go below viewport, adjust upward
          if (topPos + tooltipEstimatedHeight / 2 > viewportHeight - padding) {
            topPos = viewportHeight - padding - tooltipEstimatedHeight / 2;
          }
          
          calculatedPosition = {
            top: `${topPos}px`,
            left: `${rect.left - offset}px`,
            transform: "translate(-100%, -50%)"
          };
        }
        // Fallback to bottom-left if not enough space on pure left
        else if (spaceLeft >= padding * 2) {
          calculatedPosition = {
            top: `${Math.max(padding, Math.min(rect.bottom + offset, viewportHeight - tooltipEstimatedHeight - padding))}px`,
            left: `${padding}px`,
            transform: "translate(0, 0)"
          };
          finalPosition = "bottom-left";
        }
        // Fallback to right
        else if (spaceRight >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.right + offset}px`,
            transform: "translate(0, -50%)"
          };
          finalPosition = "right";
        }
        // Fallback to center
        else {
          calculatedPosition = {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          };
          finalPosition = "center";
        }
        break;
        
      case "right":
        // Check if there's enough space on the right
        if (spaceRight >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.right + offset}px`,
            transform: "translate(0, -50%)"
          };
        }
        // Fallback to left
        else if (spaceLeft >= tooltipWidth + offset + padding) {
          calculatedPosition = {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.left - offset}px`,
            transform: "translate(-100%, -50%)"
          };
          finalPosition = "left";
        }
        // Fallback to center
        else {
          calculatedPosition = {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          };
          finalPosition = "center";
        }
        break;
        
      default: // center
        calculatedPosition = {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        };
    }
    
    // Ensure tooltip stays within viewport bounds
    if (finalPosition === "right" || finalPosition === "left") {
      // Adjust vertical position to keep tooltip in viewport
      const topValue = parseInt(calculatedPosition.top);
      if (topValue + tooltipEstimatedHeight > viewportHeight - padding) {
        calculatedPosition.top = `${viewportHeight - tooltipEstimatedHeight - padding}px`;
        calculatedPosition.transform = calculatedPosition.transform.replace("-50%", "0");
      }
      if (topValue < padding) {
        calculatedPosition.top = `${padding}px`;
        calculatedPosition.transform = calculatedPosition.transform.replace("-50%", "0");
      }
    }
    
    setTooltipPosition(calculatedPosition);
  };

  const getHighlightStyle = () => {
    if (!targetElement) return null;
    
    const rect = targetElement.getBoundingClientRect();
    const padding = 8; // Padding around highlighted element
    
    return {
      position: "fixed",
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
      border: "3px solid #007bff",
      borderRadius: "8px",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 123, 255, 0.5)",
      pointerEvents: "none",
      zIndex: 9998,
      animation: "pulse 2s infinite",
      transition: "all 0.3s ease"
    };
  };
  
  const getInteractiveOverlayStyle = () => {
    if (!targetElement) return null;
    
    const rect = targetElement.getBoundingClientRect();
    const padding = 8;
    
    return {
      position: "fixed",
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
      zIndex: 9999,
      pointerEvents: "auto",
      cursor: "pointer"
    };
  };

  return (
    <>
      {/* Highlight overlay for target element */}
      {targetElement && (
        <>
          <div 
            role="presentation"
            aria-hidden="true"
            style={getHighlightStyle()} 
          />
          {/* Interactive overlay to allow clicks on highlighted element */}
          <div 
            role="presentation"
            style={getInteractiveOverlayStyle()}
            title={t('onboarding_element_interactive')}
            aria-label={t('onboarding_element_interactive_aria')}
          />
        </>
      )}

      {/* Warning message if target element not found */}
      {!isElementVisible && targetSelector && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            top: isMobile ? "0.5rem" : "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "6px",
            padding: isMobile ? "0.5rem 0.75rem" : "0.75rem 1rem",
            color: "#856404",
            fontSize: isMobile ? "0.85rem" : "0.9rem",
            zIndex: 10001,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            maxWidth: isMobile ? "calc(100vw - 2rem)" : "auto"
          }}
        >
          ⚠️ {t('onboarding_element_not_found')}
        </div>
      )}

      {/* Tutorial tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
        aria-live="polite"
        aria-modal="true"
        style={{
          position: "fixed",
          ...tooltipPosition,
          backgroundColor: "#ffffff",
          border: "2px solid #007bff",
          borderRadius: isMobile ? "8px" : "12px",
          padding: isMobile ? "1rem" : "1.5rem",
          width: isMobile ? "calc(100vw - 2rem)" : "auto",
          maxWidth: isMobile ? "calc(100vw - 2rem)" : "min(450px, calc(100vw - 4rem))",
          minWidth: isMobile ? "calc(100vw - 2rem)" : "320px",
          maxHeight: isMobile ? "calc(100vh - 4rem)" : "calc(100vh - 8rem)",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          zIndex: 10000,
          animation: "fadeIn 0.3s ease-in",
          boxSizing: "border-box"
        }}
        onTouchStart={(e) => {
          setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          });
        }}
        onTouchEnd={(e) => {
          if (!touchStart) return;
          
          const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
          };
          
          const deltaX = touchEnd.x - touchStart.x;
          const deltaY = Math.abs(touchEnd.y - touchStart.y);
          
          // Swipe right to go to next step
          if (deltaX > 50 && deltaY < 50 && !isLast) {
            onNext();
          }
          // Swipe left to go to previous step
          else if (deltaX < -50 && deltaY < 50 && !isFirst) {
            onPrevious();
          }
          
          setTouchStart(null);
        }}
      >
        {/* Step indicator and navigation hint */}
        <div style={{ marginBottom: isMobile ? "0.4rem" : "0.5rem" }}>
          <div 
            aria-label={t('onboarding_progress_aria', { current: stepNumber + 1, total: totalSteps })}
            style={{
              fontSize: isMobile ? "0.8rem" : "0.875rem",
              color: "#6c757d",
              fontWeight: "500"
            }}
          >
            {t('onboarding_progress', { current: stepNumber + 1, total: totalSteps })}
          </div>
          {/* Navigation hint */}
          <div 
            style={{
              fontSize: isMobile ? "0.7rem" : "0.75rem",
              color: "#9ca3af",
              marginTop: "0.25rem",
              fontStyle: "italic"
            }}
          >
            {isMobile ? t('onboarding_swipe_hint') : t('onboarding_keyboard_hint')}
          </div>
        </div>

        {/* Title */}
        <h3 
          id="tutorial-title"
          style={{
            margin: "0 0 0.75rem 0",
            color: "#212529",
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            fontWeight: "600"
          }}
        >
          {t(titleKey)}
        </h3>

        {/* Description */}
        <p 
          id="tutorial-description"
          style={{
            margin: isMobile ? "0 0 1rem 0" : "0 0 1.5rem 0",
            color: "#495057",
            fontSize: isMobile ? "0.9rem" : "0.95rem",
            lineHeight: "1.5",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto"
          }}
        >
          {t(descriptionKey)}
        </p>

        {/* Navigation buttons */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: isMobile ? "0.4rem" : "0.5rem",
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <div style={{ display: "flex", gap: isMobile ? "0.4rem" : "0.5rem" }}>
            {!isFirst && (
              <button
                ref={previousButtonRef}
                onClick={onPrevious}
                aria-label={t('onboarding_previous_aria')}
                style={{
                  padding: isMobile ? "0.5rem 0.8rem" : "0.5rem 1rem",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: isMobile ? "0.85rem" : "0.9rem",
                  fontWeight: "500",
                  touchAction: "manipulation",
                  minHeight: isMobile ? "44px" : "auto",
                  minWidth: isMobile ? "44px" : "auto"
                }}
              >
                {t('onboarding_previous')}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: isMobile ? "0.4rem" : "0.5rem" }}>
            <button
              ref={skipButtonRef}
              onClick={onSkip}
              aria-label={t('onboarding_skip_aria')}
              style={{
                padding: isMobile ? "0.5rem 0.8rem" : "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "#6c757d",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                fontWeight: "500",
                touchAction: "manipulation",
                minHeight: isMobile ? "44px" : "auto",
                minWidth: isMobile ? "44px" : "auto"
              }}
            >
              {t('onboarding_skip')}
            </button>

            <button
              ref={nextButtonRef}
              onClick={onNext}
              aria-label={isLast ? t('onboarding_finish_aria') : t('onboarding_next_aria')}
              style={{
                padding: isMobile ? "0.5rem 1rem" : "0.5rem 1.5rem",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                fontWeight: "600",
                touchAction: "manipulation",
                minHeight: isMobile ? "44px" : "auto",
                minWidth: isMobile ? "44px" : "auto"
              }}
            >
              {isLast ? t('onboarding_finish') : t('onboarding_next')}
            </button>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(0, 123, 255, 0.7);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(0, 123, 255, 0);
          }
        }

        /* Smooth scrolling for tutorial content */
        [role="dialog"] {
          scrollbar-width: thin;
          scrollbar-color: #007bff #f1f1f1;
        }

        [role="dialog"]::-webkit-scrollbar {
          width: 8px;
        }

        [role="dialog"]::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        [role="dialog"]::-webkit-scrollbar-thumb {
          background: #007bff;
          border-radius: 4px;
        }

        [role="dialog"]::-webkit-scrollbar-thumb:hover {
          background: #0056b3;
        }
      `}</style>
    </>
  );
};

export default TutorialStep;