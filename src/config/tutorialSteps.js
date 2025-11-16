/**
 * Tutorial Steps Configuration
 * 
 * Defines the onboarding tutorial flow for new users.
 * Each step highlights a specific feature or UI element.
 * 
 * Step Properties:
 * - id: Unique identifier for the step
 * - titleKey: Translation key for step title
 * - descriptionKey: Translation key for step description
 * - targetSelector: CSS selector for element to highlight (null for center modal)
 * - position: Position of tutorial card relative to target ('top', 'bottom', 'left', 'right', 'center')
 */

export const tutorialSteps = [
  {
    id: "welcome",
    titleKey: "onboarding_welcome_title",
    descriptionKey: "onboarding_welcome_description",
    targetSelector: null,
    position: "center"
  },
  {
    id: "language-selector",
    titleKey: "onboarding_language_title",
    descriptionKey: "onboarding_language_description",
    targetSelector: ".language-switcher",
    position: "left"
  },
  {
    id: "add-medication",
    titleKey: "onboarding_medication_title",
    descriptionKey: "onboarding_medication_description",
    targetSelector: "form",
    position: "right"
  },
  {
    id: "notifications",
    titleKey: "onboarding_notifications_title",
    descriptionKey: "onboarding_notifications_description",
    targetSelector: null,
    position: "center"
  },
  {
    id: "premium-limits",
    titleKey: "onboarding_premium_title",
    descriptionKey: "onboarding_premium_description",
    targetSelector: null,
    position: "center"
  }
];

export default tutorialSteps;
