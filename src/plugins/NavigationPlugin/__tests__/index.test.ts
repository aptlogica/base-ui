import { describe, it, expect, vi, beforeEach } from 'vitest';
import NavigationPlugin, { NavigationService } from '../index';

describe('NavigationPlugin', () => {
  beforeEach(() => {
    (window as any).__navigationService = undefined;
    (window as any).__navigationConfig = undefined;
    vi.restoreAllMocks();
  });

  describe('NavigationService', () => {
    it('should add menu items sorted by order and return a copy', () => {
      const svc = new NavigationService();
      svc.addMenuItem({ id: 'b', title: 'B', path: '/b', order: 2 });
      svc.addMenuItem({ id: 'a', title: 'A', path: '/a', order: 1 });

      const items = svc.getMenuItems();
      expect(items.map(i => i.id)).toEqual(['a', 'b']);

      // Returned list is a shallow copy
      items.push({ id: 'c', title: 'C', path: '/c', order: 3 });
      expect(svc.getMenuItems().map(i => i.id)).toEqual(['a', 'b']);
    });

    it('should remove menu items by id', () => {
      const svc = new NavigationService();
      svc.addMenuItem({ id: 'a', title: 'A', path: '/a', order: 1 });
      svc.addMenuItem({ id: 'b', title: 'B', path: '/b', order: 2 });

      svc.removeMenuItem('a');
      expect(svc.getMenuItems().map(i => i.id)).toEqual(['b']);
    });

    it('should notify subscribers and allow unsubscribe', () => {
      const svc = new NavigationService();
      const listener = vi.fn();

      const unsubscribe = svc.subscribe(listener);
      svc.addMenuItem({ id: 'a', title: 'A', path: '/a', order: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      svc.addMenuItem({ id: 'b', title: 'B', path: '/b', order: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialize', () => {
    it('should register navigation service, extension point, and default menu items', async () => {
      const registerService = vi.fn();
      const registerExtensionPoint = vi.fn();

      const api = {
        registerService,
        registerExtensionPoint,
      } as any;

      const config = {
        menuPosition: 'top',
        showIcons: true,
        theme: 'auto',
        maxItems: 10,
      } as any;

      await NavigationPlugin.initialize!(api, config);

      expect(registerService).toHaveBeenCalledTimes(1);
      expect(registerService).toHaveBeenCalledWith('navigation', expect.any(NavigationService));

      expect(registerExtensionPoint).toHaveBeenCalledWith(
        'navigation:menuItem',
        expect.objectContaining({
          id: expect.any(Object),
          title: expect.any(Object),
          path: expect.any(Object),
        })
      );

      const svc: NavigationService = (window as any).__navigationService;
      expect(svc).toBeInstanceOf(NavigationService);
      expect((window as any).__navigationConfig).toEqual(config);

      const defaultIds = svc.getMenuItems().map(i => i.id);
      expect(defaultIds).toEqual(['database', 'administrator']);

      const orders = svc.getMenuItems().map(i => i.order);
      expect(orders).toEqual([0, 1]);
    });
  });

  describe('onConfigurationUpdate', () => {
    it('should update window config, notify service, and dispatch event', async () => {
      const notifyListeners = vi.fn();
      (window as any).__navigationService = { notifyListeners };

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const newConfig = { menuPosition: 'left', showIcons: false, theme: 'dark', maxItems: 5 };
      await NavigationPlugin.onConfigurationUpdate!(newConfig as any, {} as any);

      expect((window as any).__navigationConfig).toEqual(newConfig);
      expect(notifyListeners).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));

      const evt = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(evt.type).toBe('navigation-config-changed');
    });
  });
});
