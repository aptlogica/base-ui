import { describe, it, expect, beforeEach } from 'vitest';
import { usePluginStore, FLYOUT_WIDTH } from '../pluginStore';

describe('pluginStore', () => {
  beforeEach(() => {
    usePluginStore.setState({
      flyoutOpen: false,
      currentPlugin: null,
      selectedWorkspace: null,
    });
  });

  it('exports the expected flyout width constant', () => {
    expect(FLYOUT_WIDTH).toBe(272);
  });

  it('opens and closes flyout with plugin id', () => {
    usePluginStore.getState().openFlyout('calendar');

    expect(usePluginStore.getState().flyoutOpen).toBe(true);
    expect(usePluginStore.getState().currentPlugin).toBe('calendar');

    usePluginStore.getState().closeFlyout();

    expect(usePluginStore.getState().flyoutOpen).toBe(false);
    expect(usePluginStore.getState().currentPlugin).toBeNull();
  });

  it('toggleFlyout opens when closed and keeps current plugin if no id provided', () => {
    usePluginStore.setState({ currentPlugin: 'grid' });
    usePluginStore.getState().toggleFlyout();

    expect(usePluginStore.getState().flyoutOpen).toBe(true);
    expect(usePluginStore.getState().currentPlugin).toBe('grid');
  });

  it('toggleFlyout opens and switches plugin when different plugin id is provided', () => {
    usePluginStore.setState({ flyoutOpen: true, currentPlugin: 'grid' });
    usePluginStore.getState().toggleFlyout('kanban');

    expect(usePluginStore.getState().flyoutOpen).toBe(true);
    expect(usePluginStore.getState().currentPlugin).toBe('kanban');
  });

  it('toggleFlyout closes when open and same plugin id is provided', () => {
    usePluginStore.setState({ flyoutOpen: true, currentPlugin: 'grid' });
    usePluginStore.getState().toggleFlyout('grid');

    expect(usePluginStore.getState().flyoutOpen).toBe(false);
    expect(usePluginStore.getState().currentPlugin).toBeNull();
  });

  it('sets selected workspace', () => {
    const workspace = { id: 'w1', name: 'Workspace 1' } as any;
    usePluginStore.getState().setSelectedWorkspace(workspace);

    expect(usePluginStore.getState().selectedWorkspace).toEqual(workspace);
  });
});
