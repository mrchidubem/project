# Firebase Setup Guide for MedAdhere

This guide walks you through setting up Firebase for the MedAdhere application.

## Prerequisites

- Google account
- Node.js and npm installed
- MedAdhere project cloned locally

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `medadhere` (or your preferred name)
4. Enable/disable Google Analytics (recommended: enable)
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the web icon (`</>`) to add a web app
2. Enter app nickname: `MedAdhere Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the Firebase configuration values (you'll need these for `.env`)

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable the following sign-in methods:
   - **Email/Password**: Click, toggle "Enable", Save
   - **Google**: Click, toggle "Enable", add support email, Save
   - (Optional) Add other providers as needed

## Step 4: Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select **Start in production mode** (we have custom rules)
4. Choose a location (select closest to your users)
5. Click "Enable"

## Step 5: Deploy Security Rules

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select: Firestore, Storage
   - Use existing project: select your MedAdhere project
   - Use default file names (firestore.rules, firestore.indexes.json)

4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 6: Enable Cloud Storage

1. In Firebase Console, go to **Build > Storage**
2. Click "Get started"
3. Start in **production mode**
4. Choose same location as Firestore
5. Click "Done"

## Step 7: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase configuration values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=medadhere-xxxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=medadhere-xxxxx
   VITE_FIREBASE_STORAGE_BUCKET=medadhere-xxxxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

## Step 8: Create Firestore Indexes (Optional)

For better query performance, create these indexes:

1. Go to **Firestore Database > Indexes**
2. Create composite indexes:
   - Collection: `medications`
     - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Collection: `adrReports`
     - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Collection: `adherenceHistory`
     - Fields: `userId` (Ascending), `date` (Descending)

Or use the Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

## Step 9: Test Configuration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check browser console for Firebase initialization message
3. If you see warnings about missing configuration, verify your `.env` file

## Optional: Local Development with Emulators

For local development without using production Firebase:

1. Install emulators:
   ```bash
   firebase init emulators
   ```
   Select: Authentication, Firestore, Storage

2. Start emulators:
   ```bash
   firebase emulators:start
   ```

3. Update `.env`:
   ```env
   VITE_USE_FIREBASE_EMULATOR=true
   ```

## Security Considerations

- **Never commit `.env` file** to version control
- Keep Firebase API keys secure (they're safe for client-side use but restrict by domain)
- Review and test security rules before production deployment
- Enable App Check for additional security (recommended for production)

## Troubleshooting

### "Firebase configuration incomplete" warning
- Check that all values in `.env` are filled in
- Ensure no values start with `your_`
- Restart development server after changing `.env`

### Authentication errors
- Verify authentication providers are enabled in Firebase Console
- Check that `authDomain` is correct in `.env`

### Firestore permission denied
- Deploy security rules: `firebase deploy --only firestore:rules`
- Verify user is authenticated before accessing data

## Next Steps

After Firebase is configured:
1. Implement AuthService (Task 2)
2. Implement DatabaseService (Task 3)
3. Implement SyncService (Task 4)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
