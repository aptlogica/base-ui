import React, { useState } from 'react';
import ConfigModal from './ConfigModal';
import { getRegisteredPlugins } from '../../core/PluginRegistry';
import { PluginConfigPanel } from '../../core/PluginConfigPanel';
import { Settings as SettingsIcon } from 'lucide-react';

const SettingsButton = () => {
  const [open, setOpen] = useState(false);
  const plugins = getRegisteredPlugins();
  return (
    <>
      <button
        className="w-10 h-10 flex items-center justify-center bg-card icons-bg hover:bg-[var(--color-gray-100)]  hover:text-[var(--color-alpha-black)] rounded-md transition-colors duration-200"
        onClick={() => setOpen(true)}
        title="Plugin Settings"
      >
        <SettingsIcon className="w-5 h-5 text-textMuted transition-transform duration-200 hover:scale-110" />
      </button>
      <ConfigModal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-10">
          {plugins.map(plugin => (
            <div key={plugin.manifest.id} className="pt-2 first:pt-0">
              <h3 className="text-lg font-semibold text-primary-brand mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary-brand" />
                {plugin.manifest.name}
              </h3>
              <PluginConfigPanel pluginId={plugin.manifest.id} />
            </div>
          ))}
        </div>
      </ConfigModal>
    </>
  );
};

export default SettingsButton; 