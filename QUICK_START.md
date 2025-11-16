# 🚀 MedAdhere - Quick Start Guide

Get MedAdhere running in 5 minutes!

---

## ⚡ Quick Setup

### 1. Clone & Install (2 minutes)

```bash
git clone https://github.com/yourusername/medadhere.git
cd medadhere
npm install
```

### 2. Configure Firebase (2 minutes)

Create `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these from [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps

### 3. Run (1 minute)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Firebase
npm run deploy           # Deploy to Firebase
firebase deploy --only firestore:rules  # Deploy rules only
firebase deploy --only hosting          # Deploy hosting only

# Testing
npm test                 # Run tests
npm run test:coverage    # Run with coverage

# Linting
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
```

---

## 🔧 Quick Troubleshooting

### Firebase Not Working?

1. Check `.env` file exists and has correct values
2. Verify Firebase project is created
3. Enable Authentication in Firebase Console
4. Enable Firestore Database
5. Deploy security rules: `firebase deploy --only firestore:rules`

### Build Errors?

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use?

```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

---

## 📱 Test the App

### Create Test Account

1. Go to Sign Up page
2. Enter email and password (min 8 chars, uppercase, lowercase, number, special char)
3. Verify email (check spam folder)
4. Log in

### Add Test Medication

1. Click "Add Medication"
2. Enter name (e.g., "Aspirin")
3. Enter dosage (e.g., "100 mg")
4. Set frequency (e.g., 2 times per day)
5. Save

### Test Offline Mode

1. Open DevTools → Network tab
2. Set to "Offline"
3. Refresh page
4. App should still work!

---

## 🌍 Change Language

1. Click language switcher in header
2. Select language
3. UI updates immediately
4. Preference is saved

---

## 🔐 Security Features Active

- ✅ Rate limiting (5 login attempts per 15 min)
- ✅ Password complexity required
- ✅ Input sanitization
- ✅ Audit logging
- ✅ Firestore security rules
- ✅ Content Security Policy

---

## 📚 Need More Help?

- **Full Setup**: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **Security**: See [SECURITY_HARDENING_SUMMARY.md](SECURITY_HARDENING_SUMMARY.md)
- **Testing**: See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Status**: See [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## 🎉 You're Ready!

MedAdhere should now be running at [http://localhost:5173](http://localhost:5173)

Happy coding! 💊

