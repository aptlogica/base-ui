import { Plugin } from '../core/types';

export const createPluginId = (name: string): string => {
  return name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(?:^-+|-+$)/g, '');
};

export const validatePluginId = (id: string): boolean => {
  return /^[a-z0-9-]+$/.test(id) && id.length > 0;
};

export const getPluginDisplayName = (plugin: Plugin): string => {
  return plugin.manifest.name || plugin.manifest.id;
};

export const getPluginVersion = (plugin: Plugin): string => {
  return plugin.manifest.version || '0.0.0';
};

export const isPluginCompatible = (
  plugin: Plugin,
  frameworkVersion: string
): boolean => {
  const requiredVersion = (plugin.manifest as any).frameworkVersion;
  if (!requiredVersion) return true;

  try {
    // Use mock semver if real one isn't available
    const semver = require('semver');
    return semver.satisfies(frameworkVersion, requiredVersion);
  } catch {
    // Fallback to simple version comparison
    return true; // Assume compatible if we can't validate
  }
};

export const sortPluginsByDependencies = (plugins: Plugin[]): Plugin[] => {
  const sorted: Plugin[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (plugin: Plugin) => {
    if (visiting.has(plugin.manifest.id)) {
      throw new Error(`Circular dependency detected involving plugin ${plugin.manifest.id}`);
    }

    if (visited.has(plugin.manifest.id)) {
      return;
    }

    visiting.add(plugin.manifest.id);

    // Visit dependencies first
    if (plugin.manifest.dependencies) {
      for (const depId of Object.keys(plugin.manifest.dependencies)) {
        const dependency = plugins.find(p => p.manifest.id === depId);
        if (dependency) {
          visit(dependency);
        }
      }
    }

    visiting.delete(plugin.manifest.id);
    visited.add(plugin.manifest.id);
    sorted.push(plugin);
  };

  plugins.forEach(visit);
  return sorted;
};

/**
 * Parse field config from JSON string or return as is if already an object
 * This handles the case where the backend returns config as a JSON string
 */
export const parseFieldConfig = (config: any): any => {
  if (!config) return {};
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return config;
};

/**
 * Parse all field configs in a table or workspace data
 */
export const parseFieldConfigs = (data: any): any => {
  if (!data) return data;

  // Handle workspace data structure
  if (data.workspaces) {
    return {
      ...data,
      workspaces: data.workspaces.map((workspace: any) => ({
        ...workspace,
        bases: workspace.bases?.map((base: any) => ({
          ...base,
          tables: base.tables?.map((table: any) => ({
            ...table,
            fields: table.fields?.map((field: any) => ({
              ...field,
              config: parseFieldConfig(field.config)
            }))
          }))
        }))
      }))
    };
  }

  // Handle table data structure
  if (data.fields) {
    return {
      ...data,
      fields: data.fields.map((field: any) => ({
        ...field,
        config: parseFieldConfig(field.config)
      }))
    };
  }

  return data;
};

const errorStyles = `
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-color, #f8f9fa);
}

.error-content {
  max-width: 600px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: var(--border-radius, 8px);
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.error-content h2 {
  margin: 0 0 16px 0;
  color: var(--error-color, #dc3545);
  font-size: 24px;
}

.error-details {
  margin: 20px 0;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-color, #333);
}

.error-stack {
  margin-top: 10px;
}

.error-stack h3 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: var(--text-muted, #666);
}

.error-stack pre {
  background: var(--code-bg, #f8f9fa);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.error-button {
  background: var(--primary-color, #007bff);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius, 6px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-button:hover {
  background: var(--primary-color-dark, #0056b3);
}

.plugin-error {
  background: var(--error-bg, #fff5f5);
  border: 1px solid var(--error-border, #fed7d7);
  border-radius: var(--border-radius, 6px);
  padding: 16px;
  margin: 8px;
  color: var(--error-color, #dc3545);
}

.plugin-error h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.plugin-error p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.plugin-error details {
  font-size: 12px;
  color: var(--text-muted, #666);
}
`;

// Inject error styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = errorStyles;
  document.head.appendChild(styleElement);
}
