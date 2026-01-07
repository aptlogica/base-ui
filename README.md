# SereniBase Frontend

A modern, extensible frontend framework for building database management applications with a plugin-based architecture.

## Status

[![Quality Gate Status](https://sonar.aptlogica.com/api/project_badges/measure?project=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb&metric=alert_status&token=sqb_fbb5149b91736778a58c20fec7d4a1400f60ca51)](https://sonar.aptlogica.com/dashboard?id=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb)

## 🚀 Features

- **Plugin-Based Architecture**: Extensible plugin system for custom views and functionality
- **Multiple View Types**: Grid, Calendar, Kanban, Gallery, Gantt Chart, and Form views
- **Rich Field Components**: Support for 20+ field types including text, numbers, dates, attachments, formulas, lookups, and more
- **Workspace & Base Management**: Multi-tenant workspace and base organization
- **User & Role Management**: Comprehensive access control with read-only support
- **Modern Tech Stack**: Built with React 19, TypeScript, Vite, and Tailwind CSS
- **Type-Safe**: Full TypeScript support with strict mode enabled
- **Responsive Design**: Mobile-friendly UI with dark mode support

## 📋 Prerequisites

- Node.js 20+ and npm
- A backend API endpoint (see Environment Variables)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd base-ui
```


2. Install dependencies:
```bash
npm install
```

3. Install SDK dependencies:
```bash
cd sdk && npm install && cd ..
```

4. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

5. Configure environment variables (see [Environment Variables](#environment-variables))

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5050`

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
```

**Note**: See `.env.example` for the complete list of required environment variables.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode


## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for testing.

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test files are located alongside source files with the `.test.ts` or `.test.tsx` extension.

## 🐳 Docker

### Build

```bash
docker build --build-arg VITE_API_BASE_URL=https://your-api.com -t serenibase-frontend .
```

### Run with Docker Compose

```bash
docker-compose up
```

The application will be available at `http://localhost:5050`

## 🔌 Plugin Development

SereniBase uses a plugin-based architecture. Plugins are located in `src/plugins/`. See existing plugins for examples.

## 📦 Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

## 🚢 Deployment

Build and run with Docker:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t serenibase-frontend .
docker run -p 5050:5050 serenibase-frontend
```

Or use Docker Compose:
```bash
docker-compose up
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code style and conventions
- Pull request process
- Testing requirements
- Branch naming conventions

## 🔒 Security

- No hardcoded secrets or API keys
- Environment variables for configuration
- Input validation on all forms

## 📄 License

**Note**: License file needs to be added.

## 💬 Support

For questions, issues, or contributions:

- Open an issue on the repository
- Contact: support@serenibase.com

---
