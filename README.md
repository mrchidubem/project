# MedAdhere

## Medication Adherence Tracking Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.23-FFCA28?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

**[Live Application](https://medadhere-bab59.web.app)** | **[Documentation](#documentation)** | **[Installation](#installation)**

</div>

## Overview

MedAdhere is an enterprise-grade Progressive Web Application designed to improve medication adherence through intelligent tracking, scheduling, and reporting capabilities. Built with healthcare compliance standards in mind, the platform provides patients with comprehensive tools to manage their medication regimens while maintaining the highest standards of data security and privacy.

### Academic Context

This project represents the capstone deliverable for the **Artificial Intelligence in Software Engineering Certificate** program at **Power Learn Project Africa** (November 2025). The implementation demonstrates proficiency in modern software engineering practices, including AI-assisted development workflows, cloud-native architecture, healthcare software engineering, and enterprise security implementation.

### Key Capabilities

- **Offline-First Architecture**: Full functionality without internet connectivity through Progressive Web App technology and intelligent caching strategies
- **Enterprise Security**: HIPAA-ready implementation with comprehensive audit logging, rate limiting, and granular access controls
- **Multi-Language Support**: Native support for six languages (English, French, Swahili, Hausa, Igbo, Yoruba) with dynamic content translation
- **Accessibility Compliance**: WCAG 2.1 AA compliant with comprehensive keyboard navigation and screen reader support
- **Privacy-Centric Design**: User-controlled data management with granular privacy settings and full data export capabilities
- **Zero-Cost Pharmacy Integration**: OpenStreetMap-based pharmacy finder requiring no API keys or external service costs

## Development Team

<table align="center">
  <tr>
    <td align="center" width="50%">
      <a href="https://github.com/VeeCC-T">
        <img src="https://github.com/VeeCC-T.png" width="100px;" alt="VeeCC-T"/>
        <br />
        <sub><b>VeeCC-T</b></sub>
      </a>
      <br />
      <sub>Lead Developer & Project Architect</sub>
      <br /><br />
      <sub>
        Project architecture and planning<br/>
        Firebase infrastructure configuration<br/>
        Core feature development<br/>
        Payment system integration
      </sub>
    </td>
    <td align="center" width="50%">
      <a href="https://github.com/Cedar-Creatives">
        <img src="https://github.com/Cedar-Creatives.png" width="100px;" alt="Cedar-Creatives"/>
        <br />
        <sub><b>Cedar-Creatives</b></sub>
      </a>
      <br />
      <sub>Co-Developer & Full-Stack Engineer</sub>
      <br /><br />
      <sub>
        Full-stack development<br/>
        Security implementation<br/>
        UI/UX design and implementation<br/>
        Database architecture<br/>
        Internationalization<br/>
        Quality assurance and deployment
      </sub>
    </td>
  </tr>
</table>

<div align="center">

**Repository**: [github.com/VeeCC-T/MedAdhere](https://github.com/VeeCC-T/MedAdhere)

</div>

## Features

### Medication Management
- Comprehensive medication database with support for adding, editing, and deleting medication records
- Configurable dosage, frequency, and scheduling parameters
- Visual medication cards with color-coded categorization
- Complete medication history tracking and audit trail

### Intelligent Reminders
- Customizable notification schedules with flexible timing options
- Snooze and dismiss functionality with configurable intervals
- Automated missed dose tracking and reporting
- Daily adherence summary notifications

### Adherence Analytics
- Real-time daily adherence rate calculation
- Visual progress indicators with trend analysis
- Historical adherence data with exportable reports
- 7-day rolling trend charts with predictive insights

### Adverse Drug Reaction (ADR) Reporting
- Structured adverse event reporting interface
- Severity classification system (mild, moderate, severe)
- Comprehensive symptom documentation
- Healthcare provider sharing capabilities with secure transmission

### Advanced Analytics Dashboard
- Longitudinal adherence trend visualization
- Medication type distribution analysis
- ADR report analytics with pattern detection
- Geographic distribution mapping for population health insights

### Pharmacy Finder
- GPS-based location detection with fallback options
- Real-time pharmacy search with configurable radius (1-50km)
- Distance calculation and intelligent sorting algorithms
- Complete pharmacy information including contact details and operating hours
- Direct navigation integration with mapping services
- Zero-cost implementation using OpenStreetMap (no API keys required)

### Premium Subscription Management
- Stripe-integrated checkout flow (demonstration mode)
- Unlimited medication and ADR report capacity
- Subscription lifecycle management
- Test environment with sandbox credentials

### Offline Capabilities
- Service Worker implementation for asset caching
- IndexedDB for local data persistence
- Background synchronization when connectivity is restored
- Real-time offline status indicator

### Security & Privacy
- Firebase Authentication with multi-factor support
- Rate limiting and brute force protection
- Granular privacy controls with user-defined settings
- Complete data export functionality
- Secure account deletion with data purging

### User Experience
- Wellness-themed design system with consistent visual language
- Smooth animations and micro-interactions
- Mobile-first responsive layout
- Interactive onboarding tutorial with contextual guidance
- Screen reader compatibility and keyboard navigation
- High contrast mode support
- Comprehensive ARIA labeling

### Internationalization
- Native support for six languages (English, French, Swahili, Hausa, Igbo, Yoruba)
- Dynamic content translation with context preservation
- Persistent language preference storage

## Technology Stack

### Frontend Architecture
- **React 18.2**: Component-based UI library with concurrent rendering
- **Vite 5.0**: Next-generation build tool with hot module replacement
- **React Router 7**: Declarative client-side routing with code splitting
- **i18next**: Internationalization framework with lazy loading
- **Recharts**: Composable charting library built on React components
- **Stripe.js**: PCI-compliant payment processing integration

### Backend Infrastructure
- **Firebase Authentication**: Managed authentication service with OAuth support
- **Cloud Firestore**: Scalable NoSQL document database with real-time synchronization
- **Firebase Hosting**: Global CDN with automatic SSL certificate provisioning
- **OpenStreetMap**: Open-source geographic data for pharmacy location services

### Security Implementation
- **DOMPurify**: Client-side XSS sanitization library
- **Content Security Policy**: Browser-level security headers
- **Firestore Security Rules**: Server-side access control and validation
- **Rate Limiting**: Request throttling for authentication endpoints
- **Audit Logging**: Comprehensive activity tracking for compliance

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Git version control system
- Active Firebase project with Firestore and Authentication enabled

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/VeeCC-T/MedAdhere.git
cd MedAdhere
```

2. Install project dependencies:
```bash
npm install
```

3. Configure Firebase environment variables by creating a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Refer to [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for comprehensive Firebase configuration instructions.

4. Start the development server:
```bash
npm run dev
```

5. Build for production deployment:
```bash
npm run build
```

6. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

## Project Structure

```
medadhere/
├── public/                      # Static assets and PWA manifest
├── src/
│   ├── components/             # React component library
│   │   ├── Auth/              # Authentication components
│   │   ├── Navigation/        # Navigation and routing components
│   │   ├── analytics/         # Data visualization components
│   │   └── ui/                # Reusable UI component library
│   ├── pages/                 # Top-level page components
│   ├── utils/                 # Utility functions and helpers
│   ├── locales/               # Translation files (i18n)
│   ├── styles/                # Global styles and design tokens
│   ├── config/                # Application configuration
│   ├── hooks/                 # Custom React hooks
│   └── App.jsx                # Root application component
├── functions/                  # Firebase Cloud Functions
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
├── storage.rules              # Firebase Storage security rules
├── firebase.json              # Firebase project configuration
└── package.json               # Project dependencies and scripts
```

## Security

### Input Validation
All user inputs are sanitized using DOMPurify to prevent XSS attacks and code injection vulnerabilities.

### Authentication Security
Rate limiting is enforced on authentication endpoints (5 attempts per 15-minute window) to prevent brute force attacks.

### Data Protection
Comprehensive Firestore security rules enforce server-side validation and access control based on user authentication state and ownership.

### HIPAA Readiness
The application implements audit logging and granular access controls to support healthcare compliance requirements.

## Supported Languages

- English (en)
- French (fr)
- Swahili (sw)
- Yoruba (yo)
- Igbo (ig)
- Hausa (ha)

## Testing

### Premium Subscription Testing
1. Access the application and authenticate
2. Navigate to the premium upgrade interface
3. Use Stripe test card number: `4242 4242 4242 4242`
4. Enter any future expiration date (e.g., 12/25) and CVC (e.g., 123)
5. Complete checkout and verify premium status activation

### Pharmacy Finder Testing
1. Navigate to the Pharmacy Finder feature
2. Configure search radius (1-50km)
3. Grant location access permissions when prompted
4. Verify pharmacy results display with complete address information and distance calculations

## Documentation

Comprehensive documentation is available in the following resources:

- [Firebase Setup Guide](FIREBASE_SETUP.md) - Complete Firebase configuration instructions
- [Quick Start Guide](QUICK_START.md) - Rapid deployment guide for new users
- [Mock Payment Guide](MOCK_PAYMENT_GUIDE.md) - Testing instructions for payment integration
- [Stripe Integration Summary](STRIPE_INTEGRATION_SUMMARY.md) - Payment system architecture documentation
- [Deployment Summary](FINAL_DEPLOYMENT_SUMMARY.md) - Production deployment procedures
- [Changelog](CHANGELOG.md) - Version history and release notes
- [Contributing Guidelines](CONTRIBUTING.md) - Contribution standards and procedures

## Contributing

Contributions are welcome from the community. Please review the [Contributing Guidelines](CONTRIBUTING.md) for detailed information on code standards, pull request procedures, and development workflows.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete terms and conditions.

## Academic Information

**Program**: Artificial Intelligence in Software Engineering Certificate  
**Institution**: Power Learn Project Africa  
**Project Classification**: Capstone Project  
**Completion Date**: November 2025

### Demonstrated Competencies
- Progressive Web Application architecture and implementation
- Cloud-native development using Firebase ecosystem
- AI-assisted development workflows and tooling
- Healthcare software engineering principles
- Enterprise-grade security implementation
- Multi-language application development
- Responsive design and accessibility compliance

## Acknowledgments

This project was made possible through the support and resources provided by:

- Power Learn Project Africa for the Artificial Intelligence in Software Engineering certificate program
- Firebase for comprehensive backend infrastructure and hosting services
- OpenStreetMap contributors for open geographic data
- The React community for robust development tools and libraries
- Stripe for payment processing infrastructure
- Program instructors, mentors, and peers who provided guidance throughout development

## Support

For technical support, bug reports, or feature requests:
- Submit an issue via [GitHub Issues](https://github.com/VeeCC-T/MedAdhere/issues)
- Contact the development team: [VeeCC-T](https://github.com/VeeCC-T) or [Cedar-Creatives](https://github.com/Cedar-Creatives)

## Citation

For academic or research use, please cite this project as:

```
VeeCC-T & Cedar-Creatives. (2025). MedAdhere: Medication Adherence Tracking Platform. 
Power Learn Project Africa - Artificial Intelligence in Software Engineering Certificate Capstone Project.
https://github.com/VeeCC-T/MedAdhere
```

---

<div align="center">

**Live Application**: https://medadhere-bab59.web.app  
**Source Repository**: https://github.com/VeeCC-T/MedAdhere

Developed by [VeeCC-T](https://github.com/VeeCC-T) and [Cedar-Creatives](https://github.com/Cedar-Creatives)

</div>
