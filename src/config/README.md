# Tutorial Steps Configuration

This directory contains configuration files for the onboarding tutorial system.

## tutorialSteps.js

Defines the sequence and content of tutorial steps shown to new users.

### Step Structure

Each tutorial step has the following properties:

```javascript
{
  id: string,              // Unique identifier for the step
  titleKey: string,        // i18n translation key for the step title
  descriptionKey: string,  // i18n translation key for the step description
  targetSelector: string | null,  // CSS selector for element to highlight
  position: string         // Position of tutorial card: 'top', 'bottom', 'left', 'right', 'center'
}
```

### Current Tutorial Flow

1. **Welcome** - Introduction to MedAdhere (center modal)
2. **Language Selection** - How to change language (highlights language switcher)
3. **Add Medication** - How to add first medication (highlights medication form)
4. **Notifications** - Explanation of notification system (center modal)
5. **Premium Limits** - Overview of free vs premium features (highlights upgrade link)

### Modifying Tutorial Steps

To add, remove, or modify tutorial steps:

1. Edit `tutorialSteps.js`
2. Ensure translation keys exist in all language files (`src/locales/*.json`)
3. Use valid CSS selectors for `targetSelector` (or `null` for center modals)
4. Test the tutorial flow after changes

### Target Selectors

Common selectors used in the app:

- `.language-switcher` - Language selection dropdown
- `form` - Medication form (first form on page)
- `a[href="/upgrade"]` - Upgrade to premium link
- `nav` - Main navigation bar
- `.usage-status` - Usage statistics display (if exists)

### Position Options

- `center` - Modal in center of screen (no target element)
- `top` - Tutorial card above target element
- `bottom` - Tutorial card below target element
- `left` - Tutorial card to left of target element
- `right` - Tutorial card to right of target element

### Translation Keys

All tutorial text must have corresponding entries in language files:

```json
{
  "onboarding_welcome_title": "Welcome to MedAdhere!",
  "onboarding_welcome_description": "Let's take a quick tour...",
  "onboarding_language_title": "Choose Your Language",
  "onboarding_language_description": "Select your preferred language...",
  // ... etc
}
```

See `src/locales/en.json` for the complete list of onboarding translation keys.


## firebaseCollections.js

Defines Firebase Firestore collection names, storage paths, and data schemas for the MedAdhere cloud sync system.

### Collections

- `users` - User profiles and settings
- `medications` - User medication data (stored in English)
- `adrReports` - Adverse drug reaction reports (stored in English)
- `adherenceHistory` - Daily adherence tracking data
- `analytics` - Aggregated analytics for healthcare providers
- `organizations` - NGO/clinic/hospital data

### Storage Paths

- `adr-photos/{userId}/{photoId}` - ADR report photos
- `profile-photos/{userId}` - User profile photos

### Data Schemas

All schemas are documented with field names and types. Text fields in medications and ADR reports are stored in English for consistency, while the user's UI language preference is stored separately.

### Usage

```javascript
import { COLLECTIONS, FIELDS } from './firebaseCollections';

// Access collection names
const medicationsRef = collection(db, COLLECTIONS.MEDICATIONS);

// Use consistent field names
const query = where(FIELDS.USER_ID, '==', userId);
```
