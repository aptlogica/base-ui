import React, { useState } from 'react';
import { useToast } from '../components/common/Toast';
import { usePluginFramework } from './PluginFrameworkContext';
import { usePluginConfig } from './usePluginConfig';

interface PluginConfigPanelProps {
  pluginId: string;
}

export const PluginConfigPanel: React.FC<PluginConfigPanelProps> = ({ pluginId }) => {
  const { pluginManager } = usePluginFramework();
  const [config, updateConfig] = usePluginConfig(pluginId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const plugin = pluginManager.getPlugin(pluginId);
  if (!plugin) {
    return <div className="text-red-500">Plugin not found</div>;
  }
  
  const { configSchema } = plugin.manifest;
  if (!configSchema) {
    return <div className="text-gray-500">No configuration available for this plugin</div>;
  }
  
  const handleChange = (key: string, value: any) => {
    const newConfig = {
      ...config,
      [key]: value
    };
    updateConfig(newConfig);
    setLastUpdated(new Date());
  };
  
  const resetToDefaults = () => {
    const defaultConfig: Record<string, any> = {};
    Object.entries(configSchema).forEach(([key, schema]) => {
      if (schema.default !== undefined) {
        defaultConfig[key] = schema.default;
      }
    });
    updateConfig(defaultConfig);
    setLastUpdated(new Date());
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pluginId}-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        updateConfig({ ...config, ...importedConfig });
        setLastUpdated(new Date());
      } catch (error) {
        // use toast for user-friendly error
        try {
          const toast = useToast();
          toast.error('Invalid configuration file');
        } catch (err) {
          // fallback to alert if toast context is unavailable
          alert('Invalid configuration file');
        }
      }
    };
    reader.readAsText(file);
  };

   return (
    <div className="mt-6 border-t pt-6">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-primary font-semibold text-base focus:outline-none hover:underline"
        >
          <span className="inline-flex items-center">⚙️ Configure {plugin.manifest.name}</span>
          <span className={`transition-transform ml-1 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {lastUpdated && (
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 ml-2">Updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 rounded bg-utility-gray-100 text-utility-gray-700 hover:bg-utility-brand-50 border border-utility-gray-200 text-sm font-medium transition"
            >
              🔄 Reset to Defaults
            </button>
            <button
              onClick={exportConfig}
              className="px-3 py-1.5 rounded bg-utility-gray-100 text-utility-gray-700 hover:bg-utility-brand-50 border border-utility-gray-200 text-sm font-medium transition"
            >
              📤 Export Config
            </button>
            <label className="px-3 py-1.5 rounded bg-utility-gray-100 text-utility-gray-700 hover:bg-utility-brand-50 border border-utility-gray-200 text-sm font-medium transition cursor-pointer">
              📥 Import Config
              <input
                type="file"
                accept=".json"
                onChange={importConfig}
                className="hidden"
              />
            </label>
          </div>

          <form className="flex flex-col gap-6">
            {Object.entries(configSchema).map(([key, schema]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-medium text-utility-gray-700 text-sm flex items-center gap-1">
                  {schema.title || key}
                  {schema.required && <span className="text-utility-error-600">*</span>}
                </label>
                {schema.type === 'boolean' ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!config[key]}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="form-checkbox h-4 w-4 text-utility-brand-600 transition"
                    />
                    <span className="text-xs text-utility-gray-600">{config[key] ? 'Enabled' : 'Disabled'}</span>
                  </label>
                ) : schema.type === 'number' ? (
                  <input
                    type="number"
                    value={config[key] || ''}
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                    min={schema.minimum}
                    max={schema.maximum}
                    step={schema.type === 'number' ? 1 : undefined}
                    className="px-3 py-2 border border-utility-gray-300 rounded bg-white text-utility-gray-900 focus:outline-none focus:ring-1 focus:ring-utility-brand-400 text-sm"
                    placeholder={schema.description || schema.title || key}
                  />
                ) : schema.enum ? (
                  <select
                    value={config[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="px-3 py-2 border border-utility-gray-300 rounded bg-white text-utility-gray-900 focus:outline-none focus:ring-1 focus:ring-utility-brand-400 text-sm"
                    title={schema.title || key}
                  >
                    {schema.enum.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : schema.type === 'array' ? (
                  <div>
                    <input
                      type="text"
                      value={Array.isArray(config[key]) ? config[key].join(', ') : ''}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                        handleChange(key, values);
                      }}
                      placeholder="Enter values separated by commas"
                      className="px-3 py-2 border border-utility-gray-300 rounded bg-white text-utility-gray-900 focus:outline-none focus:ring-1 focus:ring-utility-brand-400 text-sm"
                    />
                    <small className="text-xs text-utility-gray-500">Separate multiple values with commas</small>
                  </div>
                ) : (
                  <input
                    type={schema.format === 'password' ? 'password' : 'text'}
                    value={config[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={schema.default}
                    pattern={schema.pattern}
                    className="px-3 py-2 border border-utility-gray-300 rounded bg-white text-utility-gray-900 focus:outline-none focus:ring-1 focus:ring-utility-brand-400 text-sm"
                  />
                )}
                {schema.description && (
                  <p className="text-xs text-utility-gray-500 italic mt-1">{schema.description}</p>
                )}
                {schema.default !== undefined && (
                  <p className="text-xs text-utility-gray-400 mt-0.5">Default: {JSON.stringify(schema.default)}</p>
                )}
              </div>
            ))}
          </form>

          <div className="bg-utility-gray-50 rounded p-4 mt-4">
            <h4 className="text-xs font-semibold text-utility-gray-500 uppercase mb-2 tracking-wide">Current Configuration:</h4>
            <pre className="text-xs text-utility-gray-700 whitespace-pre-wrap break-all">{JSON.stringify(config, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
