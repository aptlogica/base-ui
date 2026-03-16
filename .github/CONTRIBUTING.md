# Contributing to Sereni Base UI

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Getting Started

1. Fork the repo and create your branch from `main`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Pull Request Process

1. If you've added code that should be tested, add tests.
2. If you've changed APIs or components, update the documentation.
3. Ensure the test suite passes:
   ```bash
   npm run test
   ```
4. Make sure your code lints:
   ```bash
   npm run lint
   ```
5. Run type checking:
   ```bash
   npm run type-check
   ```
6. Issue that pull request!

## Testing

We use Vitest for unit testing and Playwright for E2E testing:

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Code Coverage

Maintain or improve code coverage with your changes:

```bash
npm run test:coverage
```

## Coding Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use TypeScript for type safety
- Write semantic, accessible HTML
- Follow BEM methodology for CSS classes
- Use Tailwind CSS for styling
- Write clear, self-documenting code
- Add JSDoc comments for complex components

## Component Guidelines

- Create reusable, atomic components
- Use proper TypeScript interfaces for props
- Include accessibility attributes (ARIA)
- Write stories for Storybook (when applicable)
- Test components with various props and states

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add responsive navigation component

- Implement mobile-first navigation
- Add keyboard navigation support
- Include accessibility attributes

Fixes #123
```

## Versioning

We use [Semantic Versioning](http://semver.org/). For the versions available, see the [tags on this repository](https://github.com/aptlogica/base-ui/tags).

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/aptlogica/base-ui/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.