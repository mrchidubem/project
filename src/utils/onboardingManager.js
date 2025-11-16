// src/utils/onboardingManager.js
const ONBOARDING_STORAGE_KEY = "medadhere_onboarding";

const defaultOnboardingState = {
  completed: false,
  currentStep: 0,
  skipped: false,
  completedAt: null,
  lastShown: null,
  totalSteps: 5
};

class OnboardingManager {
  constructor() {
    this.storageAvailable = this.isStorageAvailable();
    this.sessionState = null;
    this.state = this.loadState();
  }

  loadState() {
    if (!this.storageAvailable) {
      return this.sessionState || { ...defaultOnboardingState };
    }
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) return { ...defaultOnboardingState };
      return { ...defaultOnboardingState, ...JSON.parse(stored) };
    } catch (err) {
      return { ...defaultOnboardingState };
    }
  }

  saveState(state) {
    const stateToSave = { ...state, lastShown: new Date().toISOString() };
    if (!this.storageAvailable) {
      this.sessionState = stateToSave;
      this.state = stateToSave;
      return;
    }
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(stateToSave));
      this.state = stateToSave;
    } catch (err) {
      this.state = stateToSave;
      this.sessionState = stateToSave;
    }
  }

  isFirstVisit() {
    return !this.state.completed && !this.state.skipped && this.state.currentStep === 0;
  }

  shouldShowTutorial() {
    return !this.state.completed && !this.state.skipped;
  }

  markCompleted() {
    this.state.completed = true;
    this.state.completedAt = new Date().toISOString();
    this.state.currentStep = this.state.totalSteps;
    this.saveState(this.state);
  }

  markSkipped() {
    this.state.skipped = true;
    this.state.completed = true;
    this.state.completedAt = new Date().toISOString();
    this.saveState(this.state);
  }

  getTutorialProgress() {
    if (this.state.completed) return 100;
    if (this.state.totalSteps === 0) return 0;
    return Math.round((this.state.currentStep / this.state.totalSteps) * 100);
  }

  getCurrentStep() {
    return this.state.currentStep;
  }

  setCurrentStep(stepNumber) {
    if (stepNumber < 0 || stepNumber > this.state.totalSteps) return;
    this.state.currentStep = stepNumber;
    this.saveState(this.state);
  }

  nextStep() {
    if (this.state.currentStep < this.state.totalSteps) {
      this.setCurrentStep(this.state.currentStep + 1);
      return true;
    }
    return false;
  }

  previousStep() {
    if (this.state.currentStep > 0) {
      this.setCurrentStep(this.state.currentStep - 1);
      return true;
    }
    return false;
  }

  resetTutorial(preserveCompletion = false) {
    const oldState = { ...this.state };
    this.state = {
      ...defaultOnboardingState,
      completed: preserveCompletion ? oldState.completed : false,
      completedAt: preserveCompletion ? oldState.completedAt : null
    };
    this.saveState(this.state);
  }

  startManualTutorial() {
    this.resetTutorial(true);
  }

  getTutorialStats() {
    return {
      completed: this.state.completed,
      skipped: this.state.skipped,
      currentStep: this.state.currentStep,
      totalSteps: this.state.totalSteps,
      progress: this.getTutorialProgress(),
      completedAt: this.state.completedAt,
      lastShown: this.state.lastShown,
      isFirstVisit: this.isFirstVisit(),
      shouldShow: this.shouldShowTutorial()
    };
  }

  setTotalSteps(total) {
    if (total > 0) {
      this.state.totalSteps = total;
      this.saveState(this.state);
    }
  }

  isStorageAvailable() {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) return false;
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  logEvent(message, data = {}) {
    console.log(`[OnboardingManager] ${message}`, data);
  }

  getRecentLogs() {
    return [];
  }
}

const onboardingManager = new OnboardingManager();
export default onboardingManager;
