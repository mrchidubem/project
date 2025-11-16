# 💊 MedAdhere - Medication Adherence Tracker

<div align="center">

![MedAdhere Logo](public/icon-192.png)

**A Progressive Web App for tracking medication adherence, managing schedules, and reporting adverse drug reactions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)](https://web.dev/progressive-web-apps/)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Security](#security)
- [Internationalization](#internationalization)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

MedAdhere is a comprehensive medication adherence tracking application designed to help patients manage their medications effectively, even in offline environments. Built with healthcare compliance in mind, it features enterprise-grade security, multi-language support, and a beautiful, accessible user interface.

### Why MedAdhere?

- **Offline-First**: Works without internet connectivity using Progressive Web App technology
- **HIPAA-Ready**: Enterprise-grade security with audit logging and access controls
- **Multi-Language**: Supports English, French, Swahili, Yoruba, Igbo, and Hausa
- **Accessible**: WCAG 2.1 AA compliant with full keyboard navigation
- **Privacy-Focused**: User data stays private with granular privacy controls

---

## ✨ Features

### Core Functionality

- **📅 Medication Management**
  - Add, edit, and delete medications
  - Set dosage, frequency, and schedules
  - Visual medication cards with color coding
  - Medication history tracking

- **⏰ Smart Reminders**
  - Customizable notification schedules
  - Snooze and dismiss options
  - Missed dose tracking
  - Daily adherence summaries

- **📊 Adherence Tracking**
  - Daily adherence rate calculation
  - Visual progress indicators
  - Historical adherence data
  - Streak tracking

- **⚠️ Adverse Drug Reaction (ADR) Reporting**
  - Report side effects and reactions
  - Severity classification (mild, moderate, severe)
  - Symptom documentation
  - Healthcare provider sharing

### Advanced Features

- **📈 Analytics Dashboard** (Healthcare Providers)
  - Adherence trends over time
  - Medication type distribution
  - ADR report analytics
  - Geographic distribution maps

- **🔍 Pharmacy Finder** (OpenStreetMap - 100% Free!)
  - GPS-based location detection
  - Real-time pharmacy search
  - Distance calculation and sorting
  - Contact information (phone, website)
  - Operating hours
  - Direct navigation links
  - No API key required!

- **🌐 Offline Support**
  - Service Worker caching
  - IndexedDB local storage
  - Background sync
  - Offline indicator

- **🔐 Privacy & Security**
  - Firebase Authentication
  - End-to-end encryption ready
  - Granular privacy settings
  - Data export functionality
  - Account deletion

### User Experience

- **🎨 Modern UI/UX**
  - Wellness-themed design system
  - Smooth animations and transitions
  - Responsive layout (mobile-first)
  - Dark mode support (coming soon)

- **♿ Accessibility**
  - Screen reader support
  - Keyboard navigation
  - High contrast mode
  - Focus indicators
  - ARIA labels

- **🌍 Internationalization**
  - 6 languages supported
  - RTL support ready
  - Dynamic content translation
  - Language persistence

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **i18next** - Internationalization
- **Chart.js** - Data visualization

### Backend & Services
- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Static hosting
- **Cloud Functions** - Serverless functions (ready)

### Security
- **DOMPurify** - XSS protection
- **Content Security Policy** - Browser security
- **Firestore Security Rules** - Database access control
- **Rate Limiting** - Brute force protection
- **Audit Logging** - HIPAA compliance

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Workbox** - Service Worker management

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/medadhere.git
   cd medadhere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.
   
   **Note**: Pharmacy Finder uses free OpenStreetMap API - no additional setup needed!

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Deploy to Firebase**
   ```bash
   npm run deploy
   ```

---

## 📁 Project Structure

```
medadhere/
├── public/                 # Static assets
│   ├── icon-192.png       # PWA icons
│   ├── icon-512.png
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication components
│   │   ├── Navigation/   # Navigation components
│   │   ├── analytics/    # Analytics charts
│   │   └── ui/           # Reusable UI components
│   ├── pages/            # Page components
│   ├── utils/            # Utility functions
│   │   ├── authService.js
│   │   ├── databaseService.js
│   │   ├── securityUtils.js
│   │   └── securityMiddleware.js
│   ├── locales/          # Translation files
│   ├── styles/           # Global styles
│   ├── hooks/            # Custom React hooks
│   ├── config/           # Configuration files
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── firestore.rules       # Firestore security rules
├── firebase.json         # Firebase configuration
├── .env.example          # Environment variables template
├── package.json          # Dependencies
└── vite.config.mjs       # Vite configuration
```

---

## 🔐 Security

MedAdhere implements enterprise-grade security measures:

### Security Features

- **Input Validation & Sanitization**
  - DOMPurify for XSS protection
  - Regex-based validation
  - Server-side validation in Firestore rules

- **Authentication Security**
  - Rate limiting (5 login attempts per 15 minutes)
  - Password complexity requirements
  - Account lockout protection
  - Secure session management

- **Data Protection**
  - Firestore security rules with granular access control
  - Audit logging for all security events
  - HTTPS/TLS encryption
  - Content Security Policy headers

- **HIPAA Compliance Ready**
  - Audit trail for PHI access
  - Access controls and authentication
  - Data encryption in transit and at rest
  - Privacy settings and consent management

See [SECURITY_HARDENING_SUMMARY.md](SECURITY_HARDENING_SUMMARY.md) for complete security documentation.

---

## 🌍 Internationalization

MedAdhere supports 6 languages out of the box:

- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇹🇿 Swahili (sw)
- 🇳🇬 Yoruba (yo)
- 🇳🇬 Igbo (ig)
- 🇳🇬 Hausa (ha)

### Adding a New Language

1. Create a new translation file in `src/locales/[language-code].json`
2. Copy the structure from `src/locales/en.json`
3. Translate all keys
4. Add the language to `src/i18n.js`
5. Update the language switcher in `src/components/LanguageSwitcher.jsx`

---

## 📚 Documentation

- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Firebase configuration guide
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and guidelines
- **[SECURITY_HARDENING_SUMMARY.md](SECURITY_HARDENING_SUMMARY.md)** - Security implementation details
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing information.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Translations contributed by the community
- Firebase for backend infrastructure

---

## 📧 Contact

For questions, suggestions, or support:

- **Issues**: [GitHub Issues](https://github.com/yourusername/medadhere/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/medadhere/discussions)

---

## 🗺️ Roadmap

- [ ] Dark mode support
- [ ] Medication interaction checker
- [ ] Prescription scanning (OCR)
- [ ] Caregiver accounts
- [ ] Medication refill reminders
- [ ] Integration with pharmacy APIs
- [ ] Wearable device integration
- [ ] Telemedicine integration

---

<div align="center">

**Made with ❤️ for better medication adherence**

[⬆ Back to Top](#-medadhere---medication-adherence-tracker)

</div>
