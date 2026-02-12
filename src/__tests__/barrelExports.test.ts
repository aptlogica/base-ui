import { describe, it, expect } from 'vitest';

import * as workspaceHooks from '../hooks/workspace';
import * as accountComponents from '../components/account';
import * as workspaceComponents from '../components/workspace';
import * as sidebarComponents from '../components/layout/sidebar/components';

import { PluginConfigManager } from '../utils/PluginConfigManager';

describe('barrel exports', () => {
  it('exports are defined', () => {
    [workspaceHooks, accountComponents, workspaceComponents, sidebarComponents].forEach(mod => {
      expect(mod).toBeDefined();
    });
  });

  it('PluginConfigManager can be constructed', () => {
    const mgr = new PluginConfigManager('/config/plugins.json');
    expect(mgr).toBeInstanceOf(PluginConfigManager);
  });
});
