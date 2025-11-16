# Contributing to MedAdhere

First off, thank you for considering contributing to MedAdhere! It's people like you that make MedAdhere such a great tool for improving medication adherence.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Translation Contributions](#translation-contributions)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues that need attention
- `documentation` - Documentation improvements

---

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/medadhere.git
   cd medadhere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Coding Guidelines

### JavaScript/React Style

- Use functional components with hooks
- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use PropTypes or TypeScript for type checking

### File Organization

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── utils/          # Utility functions
├── hooks/          # Custom hooks
├── styles/         # Global styles
└── locales/        # Translation files
```

### Component Structure

```jsx
import React from 'react';
import './ComponentName.css';

/**
 * Component description
 * @param {Object} props - Component props
 */
const ComponentName = ({ prop1, prop2 }) => {
  // Hooks
  // Event handlers
  // Render logic
  
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### CSS Guidelines

- Use BEM naming convention
- Keep selectors specific to components
- Use CSS variables for theming
- Follow mobile-first approach
- Ensure accessibility (focus states, contrast)

### Security Guidelines

- Always sanitize user input
- Use the security utils for validation
- Never expose sensitive data in client code
- Follow OWASP security best practices
- Test security features thoroughly

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(medication): add medication reminder notifications

Implement push notifications for medication reminders.
Users can now receive notifications at scheduled times.

Closes #123
```

```
fix(auth): resolve login rate limiting issue

Fixed bug where rate limiting was not properly clearing
after successful login attempts.

Fixes #456
```

---

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** (`npm test`)
4. **Update the README.md** if needed
5. **Follow the PR template** when creating your pull request
6. **Link related issues** in the PR description
7. **Request review** from maintainers
8. **Address review feedback** promptly

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] Dependent changes merged
- [ ] Screenshots added (for UI changes)

---

## Translation Contributions

We welcome translations to make MedAdhere accessible to more users!

### Adding a New Language

1. **Create translation file**
   ```bash
   cp src/locales/en.json src/locales/[language-code].json
   ```

2. **Translate all keys**
   - Keep the JSON structure intact
   - Translate values, not keys
   - Maintain placeholders (e.g., `{{name}}`)
   - Consider cultural context

3. **Update i18n configuration**
   - Add language to `src/i18n.js`
   - Add language option to `LanguageSwitcher.jsx`

4. **Test the translation**
   - Switch to the new language in the app
   - Check all pages and components
   - Verify text fits in UI elements

### Translation Guidelines

- Use formal tone for medical content
- Be concise but clear
- Maintain consistency in terminology
- Consider regional variations
- Test on actual devices

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying features
- Aim for meaningful test coverage
- Test edge cases and error conditions
- Use descriptive test names

---

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Explain non-obvious code
- Keep comments up to date

### User Documentation

- Update README for new features
- Add setup instructions for new dependencies
- Document configuration options
- Include examples and screenshots

---

## Questions?

Feel free to:

- Open an issue for discussion
- Join our community discussions
- Reach out to maintainers

---

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to MedAdhere! 🎉

