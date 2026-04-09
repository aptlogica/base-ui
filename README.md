# SereniBase UI - Modern Database Management Console

> Enterprise-grade open source admin panel and database UI builder. A comprehensive React admin panel and admin dashboard UI providing plugin-extensible UI architecture with advanced field types, multiple view layouts, and real-time collaboration capabilities for modern data management.

<p align="center">
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <a href="https://sonar.aptlogica.com/dashboard?id=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb">
    <img src="https://sonar.aptlogica.com/api/project_badges/measure?project=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb&metric=alert_status&token=sqb_fbb5149b91736778a58c20fec7d4a1400f60ca51" alt="Quality Gate">
  </a>
  <a href="https://sonar.aptlogica.com/dashboard?id=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb">
    <img src="https://sonar.aptlogica.com/api/project_badges/measure?project=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb&metric=coverage&token=sqb_fbb5149b91736778a58c20fec7d4a1400f60ca51" alt="Coverage">
  </a>
  <a href="https://sonar.aptlogica.com/dashboard?id=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb">
    <img src="https://sonar.aptlogica.com/api/project_badges/measure?project=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb&metric=security_rating&token=sqb_fbb5149b91736778a58c20fec7d4a1400f60ca51" alt="Security">
  </a>
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Status-Beta-orange.svg?style=flat-square" alt="Beta">

## Overview

**Sereni Base UI** is an open-source UI component library built with TypeScript, designed to help developers create modern, scalable, and consistent web applications faster. It offers a collection of reusable, customizable, and developer-friendly components that simplify frontend development while maintaining flexibility for building unique design systems. With a strong emphasis on reusability and customization, Sereni Base UI allows teams to design interfaces that match their brand identity while following modern UI best practices. It supports rapid development of responsive applications, enabling smoother collaboration between designers and developers.

## Key Features

- **Plugin Architecture**: Extensible UI framework supporting custom components and integrations
- **Advanced Field Types**: 25+ specialized field types including relations, formulas, and rich content
- **Multiple View Layouts**: 6 distinct view types (Grid, Kanban, Calendar, Gallery, Form, Chart)
- **Real-time Collaboration**: Live cursors, comments, and synchronized editing
- **Admin UI Toolkit**: Comprehensive admin ui framework with backend admin panel capabilities
- **Web Admin Interface**: Developer admin dashboard with open source control panel features
- **Type-Safe Integration**: Seamless API communication via serenibase-sdk
- **Modern Design System**: Accessible, responsive interface built with design best practices

## Architecture

- React 19, TypeScript, Vite
- Modular component structure
- API integration via serenibase-sdk

## Installation

```sh
npm install
```

## Configuration

See `.env.example` for environment variables and configuration options.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/aptlogica/base-ui.git
cd base-ui

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure API endpoints

# Start development server
npm run dev
```

### Environment Configuration
```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=SereniBase
VITE_ENABLE_PLUGINS=true
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy with Docker
docker build -t serenibase-ui .
docker run -p 3000:3000 serenibase-ui
```

## Development

### Prerequisites
- Node.js 18+ and npm 9+
- SereniBase backend running locally or accessible endpoint

### Setup
```bash
# Install dependencies
npm install

# Set up pre-commit hooks
npm run prepare

# Start development server with hot reload
npm run dev

# Start Storybook for component development
npm run storybook
```

### Code Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checking
npm run type-check

# Run all quality checks
npm run check-all
```

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

MIT License. Copyright (c) 2026 Aptlogica Technologies Private Limited.

---

**Made with ❤️ by the SereniBase Team**

**Links:**
- [SereniBase Backend](https://github.com/aptlogica/sereni-base)
- [Documentation](https://docs.serenibase.com)
- [Community Discord](https://discord.gg/serenibase)
- [Report Issues](https://github.com/aptlogica/base-ui/issues)
