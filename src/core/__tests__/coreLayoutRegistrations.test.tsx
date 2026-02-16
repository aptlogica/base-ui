import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { registerCoreLayoutComponents } from '../coreLayoutRegistrations';

vi.mock('../../components/common/Breadcrumb', () => ({ default: () => <div>Breadcrumb</div> }));
vi.mock('../../components/common/HeaderLogo', () => ({ default: ({ logoUrl }: { logoUrl?: string }) => <div>HeaderLogo:{logoUrl}</div> }));
vi.mock('../../components/common/HeaderWorkspaceDropdown', () => ({ default: () => <div>WorkspaceDropdown</div> }));
vi.mock('../../components/common/AdministratorSettingsButton', () => ({ default: () => <div>AdminSettings</div> }));
vi.mock('../../components/common/HeaderMembers', () => ({ default: () => <div>HeaderMembers</div> }));
vi.mock('../../components/common/UserDropdown', () => ({ default: () => <div>UserDropdown</div> }));
vi.mock('../../pages/HomePage', () => ({ default: () => <div>HomePage</div> }));

describe('registerCoreLayoutComponents', () => {
  it('registers all core layout/page extensions and stores config', () => {
    const registerExtension = vi.fn();
    const api = { registerExtension } as any;
    const config = { sidebarLogoUrl: 'https://logo.png' };

    registerCoreLayoutComponents(api, config);

    expect((globalThis as any).__workspaceConfig).toEqual(config);
    expect(registerExtension).toHaveBeenCalledTimes(7);

    const [firstCall] = registerExtension.mock.calls;
    expect(firstCall[0]).toBe('layout:header-left');
    expect(firstCall[1].id).toBe('header-logo');

    // Execute all render callbacks to cover registered closures
    const rendered = registerExtension.mock.calls.map(([, extension]) => extension.render());
    expect(rendered).toHaveLength(7);
    expect(rendered.every(Boolean)).toBe(true);
  });
});
