# Contributing to SereniBase Frontend

Thank you for your interest in contributing to SereniBase! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository** and clone your fork
2. **Create a branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd sdk && npm install && cd ..
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Follow existing code style (ESLint rules)
- **Naming**: Use descriptive names, follow existing conventions
- **Comments**: Add comments for complex logic, not obvious code

### Component Structure

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Place components in appropriate directories:
  - `src/components/common/` - Shared UI components
  - `src/components/modals/` - Modal components
  - `src/components/shared/` - Shared business components
  - `src/plugins/` - Plugin-specific components

### Plugin Development

- Plugins should be self-contained in `src/plugins/[PluginName]/`
- Register extensions using the Plugin API
- Follow existing plugin patterns (see GridViewPlugin, CalendarViewPlugin)
- Document plugin-specific configuration

### Testing

- Write tests for new features and bug fixes
- Run tests before submitting: `npm run test`
- Aim for meaningful test coverage
- Test files should be co-located: `ComponentName.test.tsx`

## 🔀 Pull Request Process

1. **Update documentation** if you change functionality
2. **Add tests** for new features or bug fixes
3. **Run linting**: `npm run lint`
4. **Run tests**: `npm run test`
5. **Ensure build succeeds**: `npm run build`
6. **Update CHANGELOG.md** (if applicable)

### PR Title Format

Use descriptive titles:
- `feat: Add dark mode toggle`
- `fix: Resolve navigation persistence issue`
- `docs: Update README with new setup steps`
- `refactor: Simplify navigation store logic`

### PR Description

Include:
- **What** changed and why
- **How** to test the changes
- **Screenshots** (for UI changes)
- **Related issues** (if any)

## 🐛 Reporting Bugs

1. Check if the bug already exists in issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Screenshots (if applicable)

## ✨ Feature Requests

1. Check if the feature was already requested
2. Create an issue describing:
   - The problem it solves
   - Proposed solution
   - Use cases
   - Mockups/wireframes (if applicable)

## 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update plugin documentation if adding new plugins
- Keep CONTRIBUTING.md up to date

## 🔍 Code Review

- All PRs require review before merging
- Address review feedback promptly
- Be open to suggestions and improvements
- Keep PRs focused and reasonably sized

## 🏗️ Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── plugins/       # Plugin implementations
├── stores/        # State management (Zustand)
├── service/       # API services
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── auth/          # Authentication logic
```

## 🧪 Testing

- **Unit Tests**: Test utilities, hooks, and pure functions
- **Component Tests**: Test component rendering and interactions
- **Integration Tests**: Test feature workflows (future)

Run tests:
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # UI test runner
```

## 🚨 Common Issues

### Build Fails
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 20+)
- Verify environment variables are set

### Tests Fail
- Ensure API endpoint is accessible
- Check test environment setup
- Review test output for specific errors

## 📞 Getting Help

- **Issues**: Open a GitHub/GitLab issue
- **Discussions**: Use project discussions (if available)
- **Email**: support@serenibase.com

## 🙏 Thank You!

Your contributions make SereniBase better for everyone. We appreciate your time and effort!
