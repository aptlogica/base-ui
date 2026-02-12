import { describe, it, expect } from 'vitest';
import { defaultRoleConfig } from '../roleConfig';
import type { AccessRole } from '../AccessRoleSelector';

describe('roleConfig', () => {
  describe('defaultRoleConfig', () => {
    it('should export defaultRoleConfig as object', () => {
      expect(defaultRoleConfig).toBeDefined();
      expect(typeof defaultRoleConfig).toBe('object');
    });

    it('should have owner role config', () => {
      const owner = defaultRoleConfig['owner' as AccessRole];
      expect(owner).toBeDefined();
      expect(owner.label).toBe('Owner');
      expect(owner.color).toBeDefined();
      expect(owner.icon).toBeDefined();
      expect(owner.description).toBeDefined();
    });

    it('should have creator role config', () => {
      const creator = defaultRoleConfig['creator' as AccessRole];
      expect(creator).toBeDefined();
      expect(creator.label).toBe('Creator');
      expect(creator.description).toContain('create');
    });

    it('should have editor role config', () => {
      const editor = defaultRoleConfig['editor' as AccessRole];
      expect(editor).toBeDefined();
      expect(editor.label).toBe('Editor');
    });

    it('should have commenter role config', () => {
      const commenter = defaultRoleConfig['commenter' as AccessRole];
      expect(commenter).toBeDefined();
      expect(commenter.label).toBe('Commenter');
    });

    it('should have viewer role config', () => {
      const viewer = defaultRoleConfig['viewer' as AccessRole];
      expect(viewer).toBeDefined();
      expect(viewer.label).toBe('Viewer');
    });

    it('should have no-access role config', () => {
      const noAccess = defaultRoleConfig['no-access' as AccessRole];
      expect(noAccess).toBeDefined();
      expect(noAccess.label).toBe('No Access');
    });

    it('should have color string for owner', () => {
      const config = defaultRoleConfig.owner;
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have color string for editor', () => {
      const config = defaultRoleConfig.editor;
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have color string for viewer', () => {
      const config = defaultRoleConfig.viewer;
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have color string for no-access', () => {
      const config = defaultRoleConfig['no-access'];
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have color string for creator', () => {
      const config = defaultRoleConfig.creator;
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have color string for commenter', () => {
      const config = defaultRoleConfig.commenter;
      expect(typeof config.color).toBe('string');
      expect(config.color.length).toBeGreaterThan(0);
    });

    it('should have description string for owner', () => {
      const config = defaultRoleConfig.owner;
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have description string for editor', () => {
      const config = defaultRoleConfig.editor;
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have description string for viewer', () => {
      const config = defaultRoleConfig.viewer;
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have description string for no-access', () => {
      const config = defaultRoleConfig['no-access'];
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have description string for creator', () => {
      const config = defaultRoleConfig.creator;
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have description string for commenter', () => {
      const config = defaultRoleConfig.commenter;
      expect(typeof config.description).toBe('string');
      expect(config.description.length).toBeGreaterThan(0);
    });

    it('should have icon for owner', () => {
      const config = defaultRoleConfig.owner;
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });

    it('should have icon for editor', () => {
      const config = defaultRoleConfig.editor;
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });

    it('should have icon for viewer', () => {
      const config = defaultRoleConfig.viewer;
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });

    it('should have icon for no-access', () => {
      const config = defaultRoleConfig['no-access'];
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });

    it('should have icon for creator', () => {
      const config = defaultRoleConfig.creator;
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });

    it('should have icon for commenter', () => {
      const config = defaultRoleConfig.commenter;
      expect(config.icon).toBeDefined();
      expect(typeof config.icon === 'function' || typeof config.icon === 'object').toBe(true);
    });
  });
});
