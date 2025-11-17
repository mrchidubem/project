# 💊 MedAdhere - Medication Adherence Tracker

<div align="center">

**A Progressive Web App for tracking medication adherence, managing schedules, and reporting adverse drug reactions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.23-orange.svg)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)](https://web.dev/progressive-web-apps/)

[Live Demo](https://medadhere-bab59.web.app) • [Features](#features) • [Installation](#installation) • [Documentation](#documentation)

</div>

---

## 📋 Project Information

### Academic Context

This project was developed as a capstone requirement for the **AI Software Engineering Certification** program at **PowerLane Project PMP**. The application demonstrates proficiency in modern web development, AI-assisted development workflows, cloud infrastructure, and healthcare software engineering principles.

**Institution**: PowerLane Project PMP  
**Program**: AI Software Engineering Certification  
**Project Type**: Capstone Project  
**Completion Date**: November 2025

### Development Team

This project was collaboratively developed by:

- **[VeeCC-T](https://github.com/VeeCC-T)** - Lead Developer & Project Architect
  - Full-stack development
  - Firebase infrastructure setup
  - Security implementation
  - UI/UX design and implementation

- **[Cedar-Creatives](https://github.com/Cedar-Creatives)** - Co-Developer & Feature Engineer
  - Feature development and integration
  - Payment system implementation
  - Multi-language support
  - Testing and quality assurance

**Repository**: https://github.com/VeeCC-T/MedAdhere

---

## 🌟 Overview

MedAdhere is a comprehensive medication adherence tracking application designed to help patients manage their medications effectively. Built with healthcare compliance in mind, it features enterprise-grade security, multi-language support, and a beautiful, accessible user interface.

This project showcases modern software engineering practices including Progressive Web App architecture, cloud-native development, AI-assisted coding workflows, and healthcare data security standards.

### Why MedAdhere?

- **Offline-First**: Works without internet using Progressive Web App technology
- **Secure**: Enterprise-grade security with audit logging and access controls
- **Multi-Language**: Supports 6 languages (EN, FR, SW, HA, IG, YO)
- **Accessible**: WCAG 2.1 AA compliant with full keyboard navigation
- **Privacy-Focused**: User data stays private with granular privacy controls
- **Free Pharmacy Finder**: Uses OpenStreetMap - no API key required!

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
  - 7-day trend charts

- **⚠️ ADR Reporting**
  - Report side effects and reactions
  - Severity classification
  - Symptom documentation
  - Healthcare provider sharing

### Advanced Features

- **📈 Analytics Dashboard**
  - Adherence trends over time
  - Medication type distribution
  - ADR report analytics
  - Geographic distribution maps

- **🔍 Pharmacy Finder** (100% Free!)
  - GPS-based location detection
  - Real-time pharmacy search (1-50km radius)
  - Distance calculation and sorting
  - Contact information and hours
  - Direct navigation links
  - **No API key required!**

- **💳 Premium Subscription**
  - Mock Stripe checkout (demo mode)
  - Unlimited medications and ADR reports
  - Test card: 4242 4242 4242 4242
  - 1-month subscription tracking

- **🌐 Offline Support**
  - Service Worker caching
  - IndexedDB local storage
  - Background sync
  - Offline indicator

- **🔐 Privacy & Security**
  - Firebase Authentication
  - Rate limiting protection
  - Granular privacy settings
  - Data export functionality
  - Account deletion

### User Experience

- **🎨 Modern UI/UX**
  - Wellness-themed design system
  - Smooth animations and transitions
  - Responsive layout (mobile-first)
  - Interactive onboarding tutorial

- **♿ Accessibility**
  - Screen reader support
  - Keyboard navigation
  - High contrast mode
  - Focus indicators
  - ARIA labels

- **🌍 Internationalization**
  - 6 languages supported
  - Dynamic content translation
  - Language persistence

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite 5.0** - Build tool
- **React Router 7** - Client-side routing
- **i18next** - Internationalization
- **Recharts** - Data visualization
- **Stripe.js** - Payment processing

### Backend & Services
- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Static hosting
- **OpenStreetMap** - Free pharmacy location data

### Security
- **DOMPurify** - XSS protection
- **Content Security Policy** - Browser security
- **Firestore Security Rules** - Database access control
- **Rate Limiting** - Brute force protection
- **Audit Logging** - Compliance tracking

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Cedar-Creatives/MedAdhere.git
   cd MedAdhere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

---

## 📁 Project Structure

```
medadhere/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication
│   │   ├── Navigation/   # Navigation
│   │   ├── analytics/    # Charts
│   │   └── ui/           # UI components
│   ├── pages/            # Page components
│   ├── utils/            # Utility functions
│   ├── locales/          # Translations
│   ├── styles/           # Global styles
│   └── App.jsx           # Main app
├── firestore.rules       # Security rules
├── firebase.json         # Firebase config
└── package.json          # Dependencies
```

---

## 🔐 Security

- **Input Validation** - DOMPurify for XSS protection
- **Authentication Security** - Rate limiting (5 attempts/15min)
- **Data Protection** - Firestore security rules
- **HIPAA Ready** - Audit logging and access controls

---

## 🌍 Languages

- 🇬🇧 English
- 🇫🇷 French
- 🇹🇿 Swahili
- 🇳🇬 Yoruba
- 🇳🇬 Igbo
- 🇳🇬 Hausa

---

## 🧪 Testing

### Test Premium Upgrade
1. Visit app and login
2. Click "Upgrade to Premium"
3. Use test card: **4242 4242 4242 4242**
4. Expiry: 12/25, CVC: 123
5. Verify premium status

### Test Pharmacy Finder
1. Navigate to Pharmacy Finder
2. Select radius (1-50km)
3. Allow location access
4. View results with addresses

---

## 📚 Documentation

- [Firebase Setup Guide](FIREBASE_SETUP.md)
- [Quick Start Guide](QUICK_START.md)
- [Mock Payment Guide](MOCK_PAYMENT_GUIDE.md)
- [Stripe Integration](STRIPE_INTEGRATION_SUMMARY.md)
- [Final Deployment Summary](FINAL_DEPLOYMENT_SUMMARY.md)
- [Changelog](CHANGELOG.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 👥 Contributors

### Development Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/VeeCC-T">
        <img src="https://github.com/VeeCC-T.png" width="100px;" alt="VeeCC-T"/>
        <br />
        <sub><b>VeeCC-T</b></sub>
      </a>
      <br />
      <sub>Lead Developer</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Cedar-Creatives">
        <img src="https://github.com/Cedar-Creatives.png" width="100px;" alt="Cedar-Creatives"/>
        <br />
        <sub><b>Cedar-Creatives</b></sub>
      </a>
      <br />
      <sub>Co-Developer</sub>
    </td>
  </tr>
</table>

### Contributions

- **VeeCC-T**: Project architecture, Firebase setup, core features, security implementation, UI/UX design
- **Cedar-Creatives**: Feature development, payment integration, internationalization, testing, deployment

---

## 🎓 Academic Information

**Program**: AI Software Engineering Certification  
**Institution**: PowerLane Project PMP  
**Project Type**: Capstone/Certification Project  
**Technologies Demonstrated**: 
- Progressive Web Apps (PWA)
- Cloud-Native Development (Firebase)
- AI-Assisted Development Workflows
- Healthcare Software Engineering
- Enterprise Security Practices
- Multi-Language Application Development
- Responsive Design & Accessibility

---

## 🙏 Acknowledgments

- **PowerLane Project PMP** for providing the AI Software Engineering certification program
- **Firebase** for backend infrastructure and hosting
- **OpenStreetMap** for free pharmacy location data
- **React Community** for excellent tools and libraries
- **Stripe** for payment processing infrastructure
- All instructors, mentors, and peers who provided guidance

---

## 📞 Support & Contact

For questions, issues, or contributions:
- Open an issue on [GitHub](https://github.com/VeeCC-T/MedAdhere/issues)
- Contact: [VeeCC-T](https://github.com/VeeCC-T) or [Cedar-Creatives](https://github.com/Cedar-Creatives)

---

## 📜 Citation

If you use this project for academic or research purposes, please cite:

```
VeeCC-T & Cedar-Creatives. (2025). MedAdhere: Medication Adherence Tracker. 
PowerLane Project PMP AI Software Engineering Certification Capstone Project.
https://github.com/VeeCC-T/MedAdhere
```

---

**Built with ❤️ by VeeCC-T & Cedar-Creatives**

**Live Demo**: https://medadhere-bab59.web.app  
**Repository**: https://github.com/VeeCC-T/MedAdhere
