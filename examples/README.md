# Sereni Base UI Examples

This directory contains practical examples demonstrating how to use and extend the Sereni Base UI components and features.

## Examples Overview

| Example | Description | Complexity |
|---------|-------------|------------|
| [Basic Setup](./basic-setup/) | Basic React app integration | Beginner |
| [Custom Components](./custom-components/) | Create custom field types and views | Intermediate |
| [Plugin Development](./plugin-development/) | Build UI plugins and extensions | Advanced |
| [Theme Customization](./theme-customization/) | Custom themes and styling | Intermediate |
| [API Integration](./api-integration/) | Connect to custom backend APIs | Advanced |

## Quick Start

Each example is a standalone React application. Choose an example that matches your needs:

### Basic Setup

```bash
cd basic-setup
npm install
npm start
```

### Custom Components

```bash
cd custom-components
npm install
npm run dev
```

## Prerequisites

- Node.js 18+
- npm 9+
- Sereni Base backend running (for API examples)

## Common Configuration

Most examples use these environment variables:

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_APP_NAME=Sereni Base UI
```

## Development Setup

1. Clone the repository
2. Choose an example directory
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure
5. Start development server: `npm start` or `npm run dev`

## Available Scripts

Each example includes these common scripts:

```bash
npm start          # Start development server
npm run build      # Build for production  
npm test           # Run tests
npm run lint       # Run ESLint
npm run type-check # Run TypeScript checks
```

## Integration with SereniBase

To use these examples with your SereniBase backend:

1. Ensure SereniBase backend is running on `http://localhost:8080`
2. Update the API configuration in each example's `.env` file
3. Configure authentication if required

## Custom Development

### Creating Custom Components

```tsx
import { BaseComponent } from '@serenibase/ui';

export const MyCustomComponent: React.FC<Props> = (props) => {
  return (
    <BaseComponent {...props}>
      {/* Your custom UI */}
    </BaseComponent>
  );
};
```

### Building Plugins

```tsx
import { Plugin } from '@serenibase/ui';

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  components: {
    CustomField: MyCustomFieldComponent,
    CustomView: MyCustomViewComponent,
  },
  hooks: {
    onDataLoad: (data) => {
      // Custom data processing
    }
  }
};
```

## Deployment

Each example can be built and deployed independently:

```bash
npm run build

# Deploy to your preferred hosting service:
# - Vercel: vercel --prod
# - Netlify: netlify deploy --prod
# - AWS: aws s3 sync build/ s3://your-bucket
```