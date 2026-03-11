# SereniBase Frontend - Modern Database Management UI

> The official React-based frontend for SereniBase - a plugin-extensible, multi-view database management interface with 25+ field types and 6 view layouts. Built with React 19, TypeScript, and Vite for blazing-fast development and production performance.

[![Version](https://img.shields.io/badge/Version-0.0.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Quality Gate Status](https://sonar.aptlogica.com/api/project_badges/measure?project=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb&metric=alert_status&token=sqb_fbb5149b91736778a58c20fec7d4a1400f60ca51)](https://sonar.aptlogica.com/dashboard?id=aptlogica_base-ui_6f26c5b2-1866-41a0-b97a-867b45ceecdb)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Plugin System](#plugin-system)
- [Field Types](#field-types)
- [Development](#development)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Docker Deployment](#docker-deployment)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)

## Overview

**SereniBase Frontend** is the modern, responsive web interface for the SereniBase platform - an open-source alternative to Airtable and Notion databases. Built with React 19 and TypeScript, it provides an intuitive, plugin-based UI for managing complex relational data with multiple view types, rich field components, and real-time collaboration features.

This frontend application connects to the **SereniBase Backend** (sereni-base) via the **gopostgrest-sdk** TypeScript SDK, providing a complete database management experience through a beautiful, extensible interface.

### Key Characteristics

- **SereniBase-Specific**: Designed exclusively for SereniBase backend integration - not a standalone application

- **Plugin-Based Architecture**: Extensible view system allowing custom plugins for Grid, Calendar, Kanban, Gallery, Gantt Chart, and Form views

- **Rich Field System**: 25+ field types including text, number, date, currency, attachments, formulas, lookups, and relational links

- **Multi-Tenant**: Workspace and Base organization for team collaboration with role-based access control

- **Modern Tech Stack**: React 19 with Hooks, TypeScript strict mode, Vite for instant HMR, Tailwind CSS for styling, React Query for data fetching

- **Developer-Friendly**: Hot module replacement, comprehensive TypeScript definitions, Vitest for testing, ESLint for code quality

### Why SereniBase Frontend?

- **Airtable/Notion Alternative**: Open-source database UI with similar functionality to commercial platforms

- **Extensibility**: Plugin system allows custom view types without modifying core code

- **Type Safety**: Full TypeScript coverage prevents runtime errors and improves developer experience

- **Performance**: Vite build system provides lightning-fast dev server and optimized production builds

- **Modern UI/UX**: Responsive design with dark mode, keyboard shortcuts, drag-and-drop, and intuitive workflows

## Features

✅ **Multi-View Data Visualization**
- **Grid View**: Spreadsheet-like interface with inline editing, sorting, filtering, grouping
- **Calendar View**: Timeline visualization for date-based records
- **Kanban View**: Drag-and-drop card board for workflow management
- **Gallery View**: Image-centric card layout for visual content
- **Gantt Chart View**: Project timeline with dependencies and milestones
- **Form View**: Customizable data entry forms with field validation

✅ **Comprehensive Field Types (25+)**
- **Text**: Single line text, Long text (textarea), Email, Phone, URL
- **Numbers**: Number, Decimal, Currency, Percent
- **Dates**: Date, DateTime, Time, Year, Duration
- **Selection**: Single select, Multi-select, Rating
- **Relationships**: Links (one-to-one, one-to-many, many-to-many), Lookup
- **Advanced**: Attachment, Formula, JSON, User, Checkbox, Button

✅ **Workspace & Base Management**
- Multi-tenant workspace organization
- Base (database) creation and management
- Table schema management with visual field editors
- View configuration and customization
- Permission management with read-only access

✅ **User Authentication & Authorization**
- JWT-based authentication with SereniBase backend
- Role-based access control (RBAC)
- User profile management
- Password reset and account settings
- Session management with automatic token refresh

✅ **Plugin System**
- Hot-loadable plugin architecture
- Built-in plugins for all 6 view types
- External plugin support for custom views
- Plugin configuration via JSON
- Development mode for plugin debugging

✅ **Developer Experience**
- React 19 with latest Hooks and Suspense
- TypeScript 5.7+ with strict mode
- Vite 6.3+ for instant HMR (Hot Module Replacement)
- Tailwind CSS 3.4+ with JIT compiler
- React Query for server state management
- Zustand for client state management
- Vitest for unit and integration testing
- ESLint with React-specific rules

✅ **Production Ready**
- Docker support with multi-stage builds
- Nginx serving with SPA fallback routing
- Environment-based configuration
- Optimized bundle size with code splitting
- Lazy loading for plugins and routes
- Error boundaries for graceful degradation
- Comprehensive error handling

## Prerequisites

Before setting up SereniBase Frontend, ensure you have the following:

### Required
- **Node.js 20+** - JavaScript runtime ([Download](https://nodejs.org/))
- **npm 10+** - Package manager (included with Node.js)
- **SereniBase Backend** - Running instance of sereni-base ([Setup Guide](https://github.com/yourusername/sereni-base#quick-start))

### Optional
- **Docker 20.10+** - For containerized deployment ([Download](https://docs.docker.com/get-docker/))
- **Docker Compose 2.0+** - For multi-container orchestration ([Download](https://docs.docker.com/compose/install/))
- **Visual Studio Code** - Recommended IDE ([Download](https://code.visualstudio.com/))

### System Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum (8GB recommended for development)
- **Disk Space**: 500MB for dependencies and build artifacts

## Quick Start

### 30-Second Local Development Setup

```bash
# Step 1: Ensure SereniBase Backend is running
# Visit https://github.com/yourusername/sereni-base for backend setup

# Step 2: Clone the repository
git clone https://github.com/yourusername/base-ui.git
cd base-ui

# Step 3: Install dependencies
npm install

# Step 4: Install SDK dependencies
cd sdk && npm install && cd ..

# Step 5: Configure environment
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your backend URL

# Step 6: Start development server
npm run dev
```

**Frontend is now running at http://localhost:5050**

**Next Steps:**
1. Open http://localhost:5050 in your browser
2. Login with your SereniBase account
3. Start managing your databases!

## Installation

### Option 1: Local Development (Recommended for Contributors)

For active development, hot module replacement, and debugging.

```bash
# Step 1: Clone the repository
git clone https://github.com/yourusername/base-ui.git
cd base-ui

# Step 2: Install root dependencies
npm install

# Step 3: Install gopostgrest-sdk dependencies
cd sdk
npm install
cd ..

# Step 4: Create environment configuration
cp .env.example .env

# Step 5: Configure backend URL
nano .env
# Set VITE_API_BASE_URL=http://localhost:8080 (or your backend URL)

# Step 6: Verify SereniBase backend is running
curl http://localhost:8080/health
# Expected: {"status":"ok"} or similar

# Step 7: Start development server
npm run dev
# Server will start at http://localhost:5050
```

**Result:** Development server with hot module replacement at http://localhost:5050

### Option 2: Docker Development

For consistent development environment across team.

```bash
# Step 1: Clone repository
git clone https://github.com/yourusername/base-ui.git
cd base-ui

# Step 2: Create environment file
cp .env.example .env
nano .env
# Set VITE_API_BASE_URL to backend URL

# Step 3: Build and run with Docker Compose
docker-compose up -d

# Step 4: Check logs
docker-compose logs -f web

# Step 5: Access application
# Frontend: http://localhost:5050
```

**Result:** Containerized frontend connected to SereniBase backend

### Option 3: Production Docker Build

For production deployment with optimized build.

```bash
# Step 1: Clone repository
git clone https://github.com/yourusername/base-ui.git
cd base-ui

# Step 2: Build Docker image with backend URL
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -t serenibase-frontend:1.0.0 \
  .

# Step 3: Run container
docker run -d \
  -p 5050:5050 \
  --name serenibase-frontend \
  serenibase-frontend:1.0.0

# Step 4: Verify deployment
curl http://localhost:5050
# Expected: HTML content of application

# Step 5: Check container logs
docker logs -f serenibase-frontend
```

**Result:** Production-optimized frontend served via Nginx on port 5050

### Option 4: Production Build (No Docker)

For deploying to static hosting (Netlify, Vercel, S3, etc.).

```bash
# Step 1: Clone repository
git clone https://github.com/yourusername/base-ui.git
cd base-ui

# Step 2: Install dependencies
npm install
cd sdk && npm install && cd ..

# Step 3: Create production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_CROSS_TAB_TTL_MS=900000
EOF

# Step 4: Build for production
npm run build
# Output will be in ./dist directory

# Step 5: Preview production build locally
npm run preview
# Preview at http://localhost:4173

# Step 6: Deploy dist/ folder to your hosting provider
# Example for AWS S3:
# aws s3 sync dist/ s3://your-bucket-name --delete

# Example for Netlify:
# netlify deploy --prod --dir=dist
```

**Result:** Static files in `dist/` ready for deployment to any static hosting

## Configuration

### Environment Variables

SereniBase Frontend uses environment variables for configuration. Create a `.env` file in the project root:

```dotenv
# === Backend API Configuration ===
VITE_API_BASE_URL=http://localhost:8080
# Full URL to SereniBase backend API
# Examples:
#   Development: http://localhost:8080
#   Production: https://api.yourdomain.com
#   Docker: http://serenibase-backend:8080

# === Session Management ===
VITE_CROSS_TAB_TTL_MS=900000
# Cross-tab session timeout in milliseconds
# Default: 900000 (15 minutes)
# This prevents session conflicts when using multiple browser tabs
```

### Default Values

If environment variables are not set:
- `VITE_API_BASE_URL`: Defaults to `http://localhost:8080`
- `VITE_CROSS_TAB_TTL_MS`: Defaults to `900000` (15 minutes)

### Configuration for Different Environments

**Local Development:**
```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_CROSS_TAB_TTL_MS=900000
```

**Docker Compose (Backend and Frontend):**
```dotenv
VITE_API_BASE_URL=http://sereni-base:8080
VITE_CROSS_TAB_TTL_MS=900000
```

**Production (Cloud Deployment):**
```dotenv
VITE_API_BASE_URL=https://api.serenibase.yourdomain.com
VITE_CROSS_TAB_TTL_MS=1800000
```

**Staging Environment:**
```dotenv
VITE_API_BASE_URL=https://api-staging.serenibase.yourdomain.com
VITE_CROSS_TAB_TTL_MS=900000
```

### Build-Time vs Runtime Configuration

**Important:** Vite environment variables are embedded at **build time**, not runtime. This means:

✅ **Correct:**
```bash
# Set environment variable before building
export VITE_API_BASE_URL=https://api.yourdomain.com
npm run build
```

❌ **Incorrect:**
```bash
# Setting environment variable after build has no effect
npm run build
export VITE_API_BASE_URL=https://api.yourdomain.com
```

**For Docker builds with ARG:**
```dockerfile
# Dockerfile accepts build argument
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
```

```bash
# Pass argument during build
docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com -t frontend .
```

### Plugin Configuration

Plugins are configured in [src/config/plugins.json](src/config/plugins.json):

```json
{
  "plugins": {
    "builtin": [
      {
        "id": "grid-view-plugin",
        "name": "Grid View Plugin",
        "enabled": true,
        "path": "./plugins/GridViewPlugin"
      },
      {
        "id": "calendar-view-plugin",
        "name": "Calendar View Plugin",
        "enabled": true,
        "path": "./plugins/CalendarViewPlugin"
      }
    ],
    "external": []
  },
  "settings": {
    "autoLoadPlugins": true,
    "allowExternalPlugins": true,
    "pluginTimeout": 10000,
    "developmentMode": false
  }
}
```

**Plugin Settings:**
- `autoLoadPlugins`: Automatically load enabled plugins on startup (default: `true`)
- `allowExternalPlugins`: Allow loading external plugins from URLs (default: `true`)
- `pluginTimeout`: Maximum time in milliseconds to wait for plugin initialization (default: `10000`)
- `developmentMode`: Enable plugin debugging and hot reload (default: `false`)

## Usage

### Starting the Development Server

```bash
# Start development server with hot module replacement
npm run dev
```

**Output:**
```
VITE v6.3.5  ready in 324 ms

➜  Local:   http://localhost:5050/
➜  Network: http://192.168.1.100:5050/
➜  press h + enter to show help
```

**Development Features:**
- Hot Module Replacement (HMR)
- Instant updates on file save
- React Fast Refresh
- Source maps for debugging
- TypeScript type checking
- ESLint warnings in console

### Login and Authentication

1. **Access Application**: Navigate to http://localhost:5050
2. **Login Page**: Enter credentials from your SereniBase account
3. **First-Time Setup**: If no account exists, create one via SereniBase backend setup wizard
4. **Dashboard**: After login, you'll see your workspaces and bases

### Creating a Workspace

```plaintext
1. Click "Create Workspace" button on homepage
2. Enter workspace name (e.g., "Marketing Team")
3. Click "Create" button
4. Workspace is now accessible from sidebar
```

### Creating a Base (Database)

```plaintext
1. Select a workspace from sidebar
2. Click "+ New Base" button
3. Enter base name (e.g., "Campaign Tracker")
4. Choose base icon (optional)
5. Click "Create Base"
6. Base opens with default table
```

### Creating a Table

```plaintext
1. Inside a base, click "+ Add Table" in sidebar
2. Enter table name (e.g., "Campaigns")
3. Click "Create"
4. Table opens in Grid View
```

### Adding Fields (Columns)

```plaintext
1. In Grid View, click "+" button in column header
2. Choose field type from dropdown (Text, Number, Date, etc.)
3. Configure field options:
   - Field name
   - Field type
   - Default value
   - Required/Optional
   - Validation rules
4. Click "Save"
5. Field appears in table
```

### Switching Views

```plaintext
1. Click "Views" dropdown in top toolbar
2. Select view type:
   - Grid: Spreadsheet layout
   - Calendar: Date-based timeline
   - Kanban: Card board with columns
   - Gallery: Image-centric cards
   - Gantt Chart: Project timeline
   - Form: Data entry form
3. View switches instantly
```

### Filtering and Sorting

**Filtering:**
```plaintext
1. Click "Filter" button in toolbar
2. Click "+ Add filter"
3. Select field, condition, and value
4. Multiple filters are combined with AND logic
5. Click "Apply"
```

**Sorting:**
```plaintext
1. Click column header dropdown
2. Select "Sort Ascending" or "Sort Descending"
3. Multiple sorts are applied in order
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Quick search |
| `Ctrl+/` / `Cmd+/` | Toggle keyboard shortcuts help |
| `Ctrl+B` / `Cmd+B` | Toggle sidebar |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Toggle full screen |
| `Enter` | Edit selected cell (Grid View) |
| `Esc` | Cancel editing |
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |

## Plugin System

SereniBase Frontend uses a plugin-based architecture for view types. This allows extending the application without modifying core code.

### Built-in Plugins

| Plugin | Purpose | Path |
|--------|---------|------|
| Grid View | Spreadsheet-like data editing | `src/plugins/GridViewPlugin` |
| Calendar View | Date-based timeline visualization | `src/plugins/CalendarViewPlugin` |
| Kanban View | Drag-and-drop card board | `src/plugins/KanbanViewPlugin` |
| Gallery View | Image-centric card layout | `src/plugins/GalleryViewPlugin` |
| Gantt Chart View | Project timeline with dependencies | `src/plugins/GanttChartViewPlugin` |
| Form View | Customizable data entry forms | `src/plugins/FormViewPlugin` |

### Plugin Structure

Each plugin must export a component that receives standardized props:

```typescript
// src/plugins/ExampleViewPlugin/index.tsx
import React from 'react';
import type { ViewPluginProps } from '../../types/plugin.types';

const ExampleViewPlugin: React.FC<ViewPluginProps> = ({
  tableData,      // Table schema and configuration
  viewData,       // View-specific configuration
  rows,           // Table row data
  onUpdateRow,    // Callback for row updates
  onDeleteRow,    // Callback for row deletion
  onCreateRow,    // Callback for new row creation
}) => {
  return (
    <div className="example-view">
      <h1>Custom View Plugin</h1>
      {/* Your custom view implementation */}
    </div>
  );
};

export default ExampleViewPlugin;
```

### Creating a Custom Plugin

**Step 1: Create Plugin Directory**

```bash
mkdir -p src/plugins/CustomViewPlugin
cd src/plugins/CustomViewPlugin
```

**Step 2: Create Plugin Component**

```typescript
// src/plugins/CustomViewPlugin/index.tsx
import React from 'react';
import type { ViewPluginProps } from '../../types/plugin.types';

const CustomViewPlugin: React.FC<ViewPluginProps> = ({
  tableData,
  viewData,
  rows,
  onUpdateRow,
}) => {
  return (
    <div className="custom-view p-4">
      <h2 className="text-2xl font-bold mb-4">{tableData.name}</h2>
      <div className="grid grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.id} className="border p-4 rounded">
            <h3>{row.name}</h3>
            {/* Render custom view layout */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomViewPlugin;
```

**Step 3: Register Plugin**

```json
// src/config/plugins.json
{
  "plugins": {
    "builtin": [
      {
        "id": "custom-view-plugin",
        "name": "Custom View Plugin",
        "enabled": true,
        "path": "./plugins/CustomViewPlugin"
      }
    ]
  }
}
```

**Step 4: Test Plugin**

```bash
npm run dev
# Navigate to a table and select custom view from view dropdown
```

### External Plugins

Load plugins from external URLs (for distributed plugin systems):

```json
{
  "plugins": {
    "external": [
      {
        "id": "external-plugin",
        "name": "External Plugin",
        "enabled": true,
        "url": "https://cdn.example.com/plugins/view-plugin.js"
      }
    ]
  }
}
```

**Security Note:** Only load external plugins from trusted sources.

## Field Types

SereniBase Frontend supports 25+ field types for different data types and use cases.

### Text Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Single Line Text** | Short text input | "John Doe" |
| **Long Text** | Multi-line textarea | "This is a detailed description..." |
| **Email** | Email address with validation | "user@example.com" |
| **Phone Number** | Phone number with formatting | "+1 (555) 123-4567" |
| **URL** | Web address with validation | "https://example.com" |

### Number Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Number** | Integer values | 42 |
| **Decimal** | Floating-point numbers | 3.14159 |
| **Currency** | Money values with formatting | $1,234.56 |
| **Percent** | Percentage values | 75% |
| **Duration** | Time duration | 2h 30m |

### Date & Time Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Date** | Calendar date | 2026-03-11 |
| **DateTime** | Date with time | 2026-03-11 14:30:00 |
| **Time** | Time only | 14:30 |
| **Year** | Year only | 2026 |

### Selection Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Single Select** | Choose one option from list | "In Progress" |
| **Multi Select** | Choose multiple options | ["Tag1", "Tag2"] |
| **Rating** | Star rating | ⭐⭐⭐⭐☆ |

### Relational Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Links** | Link to records in other tables | One-to-one, one-to-many, many-to-many |
| **Lookup** | Pull values from linked records | Display linked record field values |

### Advanced Fields

| Field Type | Description | Example |
|------------|-------------|---------|
| **Attachment** | File uploads (images, documents) | [image.jpg, document.pdf] |
| **Formula** | Calculated values | `SUM(Price * Quantity)` |
| **JSON** | Structured JSON data | `{"key": "value"}` |
| **User** | User reference with avatar | @username |
| **Checkbox** | Boolean true/false | ☑ |
| **Button** | Clickable action trigger | [Click Me] |

### Field Type Configuration

When creating a field, you can configure:

- **Field Name**: Display name for the field
- **Field Type**: Choose from 25+ types
- **Description**: Helper text (optional)
- **Required**: Make field mandatory
- **Default Value**: Pre-populate new records
- **Validation**: Custom validation rules
- **Display Options**: Formatting and rendering options

## Development

### Project Structure

```
base-ui/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.jsx                   # Application entry point
│   ├── auth/                      # Authentication utilities
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Common components (Button, Input, etc.)
│   │   ├── fields/                # Field type renderers
│   │   ├── layout/                # Layout components (Sidebar, Header)
│   │   └── views/                 # View-specific components
│   ├── config/
│   │   └── plugins.json           # Plugin configuration
│   ├── contexts/                  # React contexts
│   ├── core/                      # Core utilities and services
│   ├── hooks/                     # Custom React hooks
│   │   ├── useApi.ts              # API integration hooks
│   │   ├── useNormalizedTableData.ts  # Data normalization
│   │   └── usePluginStore.ts      # Plugin state management
│   ├── pages/                     # Top-level page components
│   │   ├── HomePage.tsx           # Workspace list
│   │   ├── LoginPage.tsx          # Authentication
│   │   ├── AdministratorPage.tsx # Admin panel
│   │   └── AccountSettingsPage.tsx # User settings
│   ├── plugins/                   # View plugins
│   │   ├── GridViewPlugin/        # Spreadsheet view
│   │   ├── CalendarViewPlugin/    # Calendar view
│   │   ├── KanbanViewPlugin/      # Kanban board
│   │   ├── GalleryViewPlugin/     # Gallery view
│   │   ├── GanttChartViewPlugin/  # Gantt chart
│   │   ├── FormViewPlugin/        # Form view
│   │   └── shared/                # Shared plugin utilities
│   ├── service/                   # API service layer
│   ├── stores/                    # Zustand state stores
│   ├── styles/                    # Global CSS and Tailwind
│   ├── types/                     # TypeScript type definitions
│   │   ├── plugin.types.ts        # Plugin interfaces
│   │   ├── fieldTypes.ts          # Field type definitions
│   │   └── column.types.ts        # Column type definitions
│   └── utils/                     # Utility functions
├── sdk/                           # gopostgrest-sdk (TypeScript SDK)
├── public/                        # Static assets
│   ├── logo.svg                   # Application logo
│   └── assets/                    # Icons and images
├── dist/                          # Production build output
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Docker image definition
├── index.html                     # HTML entry point
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest test configuration
├── eslint.config.js               # ESLint configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Start development server with HMR |
| **Build** | `npm run build` | Build for production (output to `dist/`) |
| **Preview** | `npm run preview` | Preview production build locally |
| **Lint** | `npm run lint` | Run ESLint on source files |
| **Test** | `npm run test` | Run all tests with Vitest |
| **Test UI** | `npm run test:ui` | Run tests with interactive UI |
| **Test Watch** | `npm run test:watch` | Run tests in watch mode |
| **Coverage** | `npm run test:coverage` | Generate test coverage report |

### Code Style and Linting

```bash
# Run ESLint to check code quality
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

**ESLint Configuration:**
- React-specific rules enabled
- TypeScript support
- React Hooks rules enforced
- React Refresh compatibility

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

**Strict Mode Enabled:**
- `strictNullChecks`: Catch null/undefined errors
- `strictFunctionTypes`: Type-safe function parameters
- `noImplicitAny`: Require explicit type annotations

### Hot Module Replacement (HMR)

Vite provides instant HMR for React components:

1. **Save File**: Edit any `.tsx` or `.jsx` file
2. **Instant Update**: Changes reflect in browser without full reload
3. **State Preservation**: Component state preserved across updates (React Fast Refresh)

**HMR for Plugins:**
```typescript
// Enable HMR for plugins in development
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

### Adding New Dependencies

```bash
# Install production dependency
npm install package-name

# Install development dependency
npm install --save-dev package-name

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Testing

SereniBase Frontend uses [Vitest](https://vitest.dev/) for unit and integration testing.

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with source files using `.test.ts` or `.test.tsx` extension:

```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── hooks/
│   ├── useNormalizedTableData.ts
│   └── __tests__/
│       └── useNormalizedTableData.test.ts
```

### Writing Tests

**Component Test Example:**

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    await userEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

**Hook Test Example:**

```typescript
// src/hooks/__tests__/useNormalizedTableData.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useNormalizedTableData from '../useNormalizedTableData';

describe('useNormalizedTableData', () => {
  it('normalizes table data correctly', () => {
    const { result } = renderHook(() => useNormalizedTableData(mockData));
    
    expect(result.current.normalizedData).toBeDefined();
    expect(result.current.normalizedData.fields).toHaveLength(5);
  });
});
```

### Coverage Report

After running `npm run test:coverage`, view the coverage report:

```bash
# Open HTML coverage report in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

**Coverage Thresholds:**
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Building for Production

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output directory: dist/
# Contains:
# - index.html (entry point)
# - assets/ (JS, CSS, images)
# - Minified and tree-shaken code
# - Hashed filenames for cache busting
```

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-a1b2c3d4.js      # Main bundle
│   ├── index-e5f6g7h8.css     # Styles
│   ├── GridViewPlugin-i9j0k1l2.js  # Code-split plugin
│   └── ...
└── logo.svg
```

### Preview Production Build

```bash
# Start local server to preview production build
npm run preview

# Access at http://localhost:4173
```

### Build Optimization

Vite automatically applies:
- **Tree Shaking**: Removes unused code
- **Code Splitting**: Lazy loads plugins and routes
- **Minification**: Compresses JS and CSS
- **Asset Hashing**: Cache busting for updated files
- **Source Maps**: Optional for debugging production issues

### Build Performance

| Metric | Development | Production |
|--------|-------------|-----------|
| **Bundle Size** | Not optimized | ~500KB (gzipped) |
| **Build Time** | Instant (HMR) | ~30s |
| **Code Splitting** | No | Yes (per plugin) |
| **Minification** | No | Yes |
| **Tree Shaking** | No | Yes |

## Docker Deployment

### Docker Compose Deployment

**Step 1: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  # SereniBase Backend (required)
  sereni-base:
    image: serenibase/backend:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/serenibase
    depends_on:
      - postgres

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=serenibase
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # SereniBase Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://sereni-base:8080
    ports:
      - "5050:5050"
    depends_on:
      - sereni-base
    restart: unless-stopped

volumes:
  postgres_data:
```

**Step 2: Deploy Stack**

```bash
docker-compose up -d
```

**Step 3: Access Application**

- Frontend: http://localhost:5050
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/swagger/index.html

### Dockerfile Explanation

```dockerfile
# Multi-stage build for minimal image size

# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept API URL as build argument
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Install dependencies
COPY package*.json ./
COPY gopostgrest-sdk-1.0.0.tgz ./
RUN npm install --no-audit --no-fund

# Build application
COPY . .
RUN npm run build

# Stage 2: Runtime stage with Nginx
FROM nginx:1.29.4-alpine AS runner

# Configure Nginx for SPA routing
RUN printf '%s\n' 'server {' \
  '    listen 5050;' \
  '    location / {' \
  '        try_files $uri $uri/ /index.html;' \
  '    }' \
  '}' > /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5050
```

**Image Size:** ~50MB (Alpine + Nginx + static assets)

### Kubernetes Deployment

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: serenibase-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: serenibase-frontend
  template:
    metadata:
      labels:
        app: serenibase-frontend
    spec:
      containers:
      - name: frontend
        image: serenibase-frontend:1.0.0
        ports:
        - containerPort: 5050
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: serenibase-frontend
spec:
  selector:
    app: serenibase-frontend
  ports:
  - port: 80
    targetPort: 5050
  type: LoadBalancer
```

**Deploy:**

```bash
kubectl apply -f deployment.yaml
```

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│                  (React 19 + TypeScript)                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────┐
│            SereniBase Frontend (Port 5050)              │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Router (SPA Routing)                    │    │
│  │  • /login, /workspace/:id, /base/:id/table/:id│    │
│  └────────────┬───────────────────────────────────┘    │
│               │                                         │
│  ┌────────────▼──────────┐                              │
│  │  Pages & Components   │                              │
│  │  • HomePage           │                              │
│  │  • LoginPage          │                              │
│  │  • WorkspacePage      │                              │
│  │  • BasePage           │                              │
│  └────────────┬──────────┘                              │
│               │                                         │
│  ┌────────────▼──────────┐                              │
│  │  Plugin System        │                              │
│  │  • Grid View          │                              │
│  │  • Calendar View      │                              │
│  │  • Kanban View        │                              │
│  │  • Gallery View       │                              │
│  │  • Gantt Chart        │                              │
│  │  • Form View          │                              │
│  └────────────┬──────────┘                              │
│               │                                         │
│  ┌────────────▼──────────┐                              │
│  │  State Management     │                              │
│  │  • Zustand (Client)   │                              │
│  │  • React Query (API)  │                              │
│  └────────────┬──────────┘                              │
│               │                                         │
│  ┌────────────▼──────────┐                              │
│  │  gopostgrest-sdk      │                              │
│  │  (TypeScript SDK)     │                              │
│  └────────────┬──────────┘                              │
└────────────────┼──────────────────────────────────────┘
                 │ REST API (JSON)
                 │ Authorization: Bearer <JWT>
┌────────────────▼──────────────────────────────────────┐
│          SereniBase Backend (Port 8080)                │
│  ┌────────────────────────────────────────────────┐    │
│  │  Go API (sereni-base)                          │    │
│  │  • JWT Authentication                          │    │
│  │  • Workspace/Base/Table/View CRUD              │    │
│  │  • Column/Row/Cell Operations                  │    │
│  └────────────┬───────────────────────────────────┘    │
│               │                                         │
│  ┌────────────▼──────────┐                              │
│  │  PostgreSQL Database  │                              │
│  │  • Schema Management  │                              │
│  │  • Data Storage       │                              │
│  └───────────────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**1. User Authentication:**
```
User Login → Frontend → SDK → Backend → JWT Token → Frontend Storage → Authenticated Session
```

**2. Fetching Table Data:**
```
Component Mount → useApi Hook → React Query → SDK → Backend API → PostgreSQL → Response → Normalization → UI Rendering
```

**3. Updating Cell Value:**
```
User Edit → Grid View Plugin → onUpdateRow Callback → SDK → Backend API → PostgreSQL → Success → React Query Invalidation → UI Update
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI Framework** | React 19.2.3 | Component-based UI rendering |
| **Language** | TypeScript 5.7+ | Type-safe development |
| **Build Tool** | Vite 6.3+ | Fast dev server and bundling |
| **Styling** | Tailwind CSS 3.4+ | Utility-first CSS framework |
| **Routing** | React Router 7.12+ | Client-side SPA routing |
| **State (Client)** | Zustand 5.0+ | Lightweight state management |
| **State (Server)** | React Query 5.90+ | Server state caching and sync |
| **API Client** | gopostgrest-sdk | TypeScript SDK for backend communication |
| **Testing** | Vitest 2.0+ | Fast unit testing framework |
| **Linting** | ESLint 9.25+ | Code quality and consistency |
| **Icons** | Lucide React 0.563+ | Beautiful icon library |
| **Date/Time** | Luxon 3.7+ | DateTime manipulation |
| **Virtualization** | React Virtual 3.13+ | Efficient rendering of large lists |

## Troubleshooting

### Common Issues

#### 1. Cannot Connect to Backend API

**Error:**
```
Failed to fetch data from API
Network Error: Connection refused
```

**Solution:**
```bash
# Verify backend is running
curl http://localhost:8080/health

# Check VITE_API_BASE_URL in .env
cat .env
# Should match your backend URL

# For Docker Compose, use service name
VITE_API_BASE_URL=http://sereni-base:8080

# Restart frontend after changing .env
npm run dev
```

#### 2. Build Fails - Out of Memory

**Error:**
```
JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or in package.json:
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
}
```

#### 3. Hot Module Replacement Not Working

**Error:**
```
Changes not reflecting in browser
HMR connection failed
```

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev

# Check firewall/antivirus blocking WebSocket connections (port 5050)

# Use polling instead of filesystem watching
npm run dev -- --force
```

#### 4. Docker Build - VITE_API_BASE_URL Not Applied

**Error:**
```
Frontend connects to http://localhost:8080 instead of production URL
```

**Solution:**
```bash
# Ensure ARG is passed during build
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -t frontend .

# For Docker Compose, use args in docker-compose.yml
services:
  frontend:
    build:
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL}
```

#### 5. Plugin Not Loading

**Error:**
```
Plugin 'grid-view-plugin' failed to load
Module not found
```

**Solution:**
```bash
# Check plugin path in plugins.json
cat src/config/plugins.json
# "path": "./plugins/GridViewPlugin" (no .tsx extension)

# Verify plugin file exists
ls src/plugins/GridViewPlugin/index.tsx

# Check for TypeScript errors
npm run dev
# Look for compile errors in console

# Clear cache and rebuild
rm -rf node_modules/.vite dist
npm run dev
```

#### 6. Authentication Token Expired

**Error:**
```
401 Unauthorized
Token expired or invalid
```

**Solution:**
```bash
# Logout and login again
# Frontend automatically redirects to /login

# Check token expiration in browser DevTools:
# Application → Local Storage → auth-storage

# Adjust token TTL with VITE_CROSS_TAB_TTL_MS in .env
VITE_CROSS_TAB_TTL_MS=1800000  # 30 minutes
```

## FAQ

**Q: Can I use SereniBase Frontend without the backend?**
A: No. SereniBase Frontend is specifically designed to work with the SereniBase Backend (sereni-base). It requires a running instance of sereni-base to function.

**Q: What is the difference between base-ui and sereni-base?**
A: **sereni-base** is the Go-based backend API and database management system. **base-ui** is the React-based frontend user interface. Together they form the complete SereniBase platform.

**Q: Can I integrate SereniBase Frontend with a different backend?**
A: Not directly. The frontend uses the gopostgrest-sdk which is tightly coupled to the SereniBase backend API structure. You would need to modify the SDK or create an adapter layer.

**Q: How do I add a new view type?**
A: Create a new plugin in `src/plugins/` following the plugin structure (see [Plugin System](#plugin-system)), then register it in `src/config/plugins.json`.

**Q: Can I customize the theme or colors?**
A: Yes! Modify `tailwind.config.js` to customize colors, fonts, spacing, and other design tokens. Dark mode is supported via the `dark:` variant.

**Q: How do I add a new field type?**
A: Add the field type to `src/types/fieldTypes.ts`, create a field renderer in `src/components/fields/`, and update the field type map in `src/utils/fieldType.ts`.

**Q: Does it support real-time collaboration?**
A: Currently, real-time collaboration is not implemented. Multiple users can work on the same base, but changes require manual refresh. WebSocket support for real-time updates is planned for future releases.

**Q: How do I deploy to Vercel/Netlify/AWS?**
A: Build the project with `npm run build`, then deploy the `dist/` folder. Ensure VITE_API_BASE_URL points to your production backend. See [Production Build](#building-for-production).

**Q: What browsers are supported?**
A: Modern browsers with ES2020 support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Internet Explorer is not supported.

**Q: How do I report bugs or request features?**
A: Open an issue on GitHub with a clear description, steps to reproduce, and expected behavior. For feature requests, explain the use case and benefits.

**Q: Is there a hosted version of SereniBase?**
A: SereniBase is open-source and self-hosted. There is currently no official managed hosting service, but you can deploy it to any cloud provider (AWS, GCP, Azure, DigitalOcean, etc.).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/yourusername/base-ui.git
   cd base-ui
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** with clear commit messages
5. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) file for full license text.

---

**Made with ❤️ by the SereniBase Team**

**Links:**
- [SereniBase Backend](https://github.com/yourusername/sereni-base)
- [Documentation](https://docs.serenibase.com)
- [Community Discord](https://discord.gg/serenibase)
- [Report Issues](https://github.com/yourusername/base-ui/issues)
