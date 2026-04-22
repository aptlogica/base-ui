# Plugin System (Starter Guide)

This document is a starter guide for building plugins for `base-ui`. The plugin API is evolving — treat this as a living document and expand as the API stabilizes.

## Goals

- Allow registering custom field types
- Allow adding view layouts (Grid, Kanban, Gantt, etc.)
- Allow toolbar actions and UI extensions

## Quick Example

```typescript
// Example: register a custom field type
import { registerPlugin } from '@serenibase/ui-plugins'

registerPlugin({
  type: 'field',
  name: 'my-custom-field',
  component: MyFieldComponent,
  schema: {
    title: 'My Custom Field',
    type: 'object',
    properties: {
      optionA: { type: 'string' }
    }
  }
})
```

## Plugin Shape (conceptual)

- `type`: one of `field | view | action | layout`
- `name`: unique identifier for the plugin
- `component`: React component to render
- `schema` (optional): JSON Schema describing configuration options
- `metadata` (optional): author, version, description

## Development

- Run Storybook during development to iterate on UI components: `npm run storybook`.
- Use the local `serenibase-sdk-1.0.0.tgz` for local development, or install the published `serenibase-sdk` package for production.

## Future Work

- Add API reference for `registerPlugin` and plugin lifecycle hooks
- Provide examples for view/layout plugins (Kanban/Gantt)
- Add tests and end-to-end examples demonstrating plugin loading order and isolation

If you'd like, I can expand this with a full plugin API reference and example repository demonstrating a custom field plugin and a custom view plugin.
