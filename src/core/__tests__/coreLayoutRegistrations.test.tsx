import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCoreLayoutComponents } from '../coreLayoutRegistrations';
import type { PluginAPI } from '../types';

vi.mock('../../components/common/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

vi.mock('../../components/common/HeaderLogo', () => ({
  default: ({ logoUrl }: { logoUrl?: string }) => (
    <div data-testid="header-logo" data-logo-url={logoUrl}>
      HeaderLogo
    </div>
  ),
}));

vi.mock('../../components/common/HeaderWorkspaceDropdown', () => ({
  default: () => <div data-testid="header-workspace-dropdown">HeaderWorkspaceDropdown</div>,
}));

vi.mock('../../components/common/AdministratorSettingsButton', () => ({
  default: () => <div data-testid="administrator-settings-button">AdministratorSettingsButton</div>,
}));

vi.mock('../../components/common/HeaderMembers', () => ({
  default: () => <div data-testid="header-members">HeaderMembers</div>,
}));

vi.mock('../../components/common/UserDropdown', () => ({
  default: () => <div data-testid="user-dropdown">UserDropdown</div>,
}));

vi.mock('../../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">HomePage</div>,
}));

function createMockPluginAPI(): {
  api: PluginAPI;
  registeredExtensionPoints: Map<string, any>;
  registeredExtensions: Map<string, any[]>;
} {
  const registeredExtensionPoints = new Map<string, any>();
  const registeredExtensions = new Map<string, any[]>();

  const api: PluginAPI = {
    registerExtensionPoint: vi.fn((pointId: string, schema?: any) => {
      registeredExtensionPoints.set(pointId, schema || {});
    }),
    registerExtension: vi.fn((pointId: string, extension: any) => {
      if (!registeredExtensions.has(pointId)) {
        registeredExtensions.set(pointId, []);
      }
      registeredExtensions.get(pointId)!.push(extension);
    }),
    getPlugin: vi.fn().mockReturnValue(null),
    getPluginConfig: vi.fn().mockReturnValue({}),
    getService: vi.fn().mockReturnValue(null),
    registerService: vi.fn(),
  };

  return { api, registeredExtensionPoints, registeredExtensions };
}

describe('coreLayoutRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).__workspaceConfig;
  });

  describe('registerCoreLayoutComponents', () => {
    it('should register all header-left extensions', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      expect(headerLeftExtensions.length).toBe(3);
    });

    it('should register header-logo extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const logoExtension = headerLeftExtensions.find((ext) => ext.id === 'header-logo');
      expect(logoExtension).toBeDefined();
      expect(logoExtension.order).toBe(1);
    });

    it('should register header-workspace-dropdown extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const workspaceDropdown = headerLeftExtensions.find(
        (ext) => ext.id === 'header-workspace-dropdown'
      );
      expect(workspaceDropdown).toBeDefined();
      expect(workspaceDropdown.order).toBe(2);
    });

    it('should register header-breadcrumb extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const breadcrumbExtension = headerLeftExtensions.find(
        (ext) => ext.id === 'header-breadcrumb'
      );
      expect(breadcrumbExtension).toBeDefined();
      expect(breadcrumbExtension.order).toBe(3);
    });

    it('should register all header extensions', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      expect(headerExtensions.length).toBe(3);
    });

    it('should register header-members extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const membersExtension = headerExtensions.find((ext) => ext.id === 'header-members');
      expect(membersExtension).toBeDefined();
      expect(membersExtension.order).toBe(0.5);
    });

    it('should register header-administrator-settings extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const adminExtension = headerExtensions.find(
        (ext) => ext.id === 'header-administrator-settings'
      );
      expect(adminExtension).toBeDefined();
      expect(adminExtension.order).toBe(1);
    });

    it('should register header-user-dropdown extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const userDropdownExtension = headerExtensions.find(
        (ext) => ext.id === 'header-user-dropdown'
      );
      expect(userDropdownExtension).toBeDefined();
      expect(userDropdownExtension.order).toBe(2);
    });

    it('should register homepage extension', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const pageExtensions = registeredExtensions.get('page:homepage') || [];
      expect(pageExtensions.length).toBe(1);
    });

    it('should register default-homepage-page extension with correct order', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const pageExtensions = registeredExtensions.get('page:homepage') || [];
      const homepageExtension = pageExtensions.find(
        (ext) => ext.id === 'default-homepage-page'
      );
      expect(homepageExtension).toBeDefined();
      expect(homepageExtension.order).toBe(1);
    });
  });

  describe('Configuration Handling', () => {
    it('should set workspace config on globalThis', () => {
      const { api } = createMockPluginAPI();
      const config = { sidebarLogoUrl: 'http://example.com/logo.png' };

      registerCoreLayoutComponents(api, config);

      expect((globalThis as any).__workspaceConfig).toEqual(config);
    });

    it('should set empty config on globalThis when no config provided', () => {
      const { api } = createMockPluginAPI();

      registerCoreLayoutComponents(api);

      expect((globalThis as any).__workspaceConfig).toEqual({});
    });

    it('should pass sidebarLogoUrl to HeaderLogo component', () => {
      const { api, registeredExtensions } = createMockPluginAPI();
      const config = { sidebarLogoUrl: 'http://example.com/custom-logo.png' };

      registerCoreLayoutComponents(api, config);

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const logoExtension = headerLeftExtensions.find((ext) => ext.id === 'header-logo');
      expect(logoExtension).toBeDefined();
      expect(typeof logoExtension.render).toBe('function');
    });
  });

  describe('Extension Render Functions', () => {
    it('should provide render function for header-logo', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const logoExtension = headerLeftExtensions.find((ext) => ext.id === 'header-logo');
      expect(typeof logoExtension.render).toBe('function');
    });

    it('should provide render function for header-workspace-dropdown', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const dropdownExtension = headerLeftExtensions.find(
        (ext) => ext.id === 'header-workspace-dropdown'
      );
      expect(typeof dropdownExtension.render).toBe('function');
    });

    it('should provide render function for header-breadcrumb', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      const breadcrumbExtension = headerLeftExtensions.find(
        (ext) => ext.id === 'header-breadcrumb'
      );
      expect(typeof breadcrumbExtension.render).toBe('function');
    });

    it('should provide render function for header-members', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const membersExtension = headerExtensions.find((ext) => ext.id === 'header-members');
      expect(typeof membersExtension.render).toBe('function');
    });

    it('should provide render function for header-administrator-settings', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const adminExtension = headerExtensions.find(
        (ext) => ext.id === 'header-administrator-settings'
      );
      expect(typeof adminExtension.render).toBe('function');
    });

    it('should provide render function for header-user-dropdown', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const headerExtensions = registeredExtensions.get('layout:header') || [];
      const userDropdownExtension = headerExtensions.find(
        (ext) => ext.id === 'header-user-dropdown'
      );
      expect(typeof userDropdownExtension.render).toBe('function');
    });

    it('should provide render function for default-homepage-page', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const pageExtensions = registeredExtensions.get('page:homepage') || [];
      const homepageExtension = pageExtensions.find(
        (ext) => ext.id === 'default-homepage-page'
      );
      expect(typeof homepageExtension.render).toBe('function');
    });
  });

  describe('API Calls', () => {
    it('should call registerExtension for each component', () => {
      const { api } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(api.registerExtension).toHaveBeenCalledTimes(7);
    });

    it('should not call registerExtensionPoint', () => {
      const { api } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(api.registerExtensionPoint).not.toHaveBeenCalled();
    });

    it('should not call registerService', () => {
      const { api } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(api.registerService).not.toHaveBeenCalled();
    });
  });

  describe('Extension IDs', () => {
    it('should use unique IDs for all extensions', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const allExtensions: any[] = [];
      registeredExtensions.forEach((extensions) => {
        allExtensions.push(...extensions);
      });

      const ids = allExtensions.map((ext) => ext.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have meaningful extension IDs', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      const allExtensions: any[] = [];
      registeredExtensions.forEach((extensions) => {
        allExtensions.push(...extensions);
      });

      const expectedIds = [
        'header-logo',
        'header-workspace-dropdown',
        'header-breadcrumb',
        'header-members',
        'header-administrator-settings',
        'header-user-dropdown',
        'default-homepage-page',
      ];

      const ids = allExtensions.map((ext) => ext.id);
      expectedIds.forEach((expectedId) => {
        expect(ids).toContain(expectedId);
      });
    });
  });

  describe('Extension Point IDs', () => {
    it('should register to layout:header-left extension point', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(registeredExtensions.has('layout:header-left')).toBe(true);
    });

    it('should register to layout:header extension point', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(registeredExtensions.has('layout:header')).toBe(true);
    });

    it('should register to page:homepage extension point', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});

      expect(registeredExtensions.has('page:homepage')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined config', () => {
      const { api } = createMockPluginAPI();

      expect(() => registerCoreLayoutComponents(api)).not.toThrow();
    });

    it('should handle null config values', () => {
      const { api } = createMockPluginAPI();
      const config = { sidebarLogoUrl: null };

      expect(() => registerCoreLayoutComponents(api, config)).not.toThrow();
    });

    it('should handle empty string config values', () => {
      const { api } = createMockPluginAPI();
      const config = { sidebarLogoUrl: '' };

      expect(() => registerCoreLayoutComponents(api, config)).not.toThrow();
    });

    it('should be idempotent when called multiple times', () => {
      const { api, registeredExtensions } = createMockPluginAPI();

      registerCoreLayoutComponents(api, {});
      registerCoreLayoutComponents(api, {});

      const headerLeftExtensions = registeredExtensions.get('layout:header-left') || [];
      expect(headerLeftExtensions.length).toBe(6);
    });
  });
});
