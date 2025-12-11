import React, { useState, useEffect } from 'react';
import { NavigationConfig, MenuItem, NavigationService } from '../index';
import * as LucideIcons from 'lucide-react';

interface NavigationMenuProps {
  config: NavigationConfig;
  navigationService: NavigationService;
}

const getLucideIcon = (iconName: string) => {
  // Convert kebab-case or snake_case to PascalCase (e.g., 'icon-home' -> 'Home')
  const cleanName = iconName.replace(/^icon-/, '').replace(/(^|[-_])(\w)/g, (_, __, c) => c ? c.toUpperCase() : '');
  return (LucideIcons as any)[cleanName] || LucideIcons.Menu;
};

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  config, 
  navigationService 
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    const updateMenuItems = () => {
      const items = navigationService.getMenuItems().slice(0, localConfig.maxItems);
      setMenuItems(items);
    };

    updateMenuItems();
    const unsubscribe = navigationService.subscribe(updateMenuItems);

    // Listen for config changes
    const handleConfigChange = () => {
      setLocalConfig((window as any).__navigationConfig);
    };
    window.addEventListener('navigation-config-changed', handleConfigChange);

    return () => {
      unsubscribe();
      window.removeEventListener('navigation-config-changed', handleConfigChange);
    };
  }, [navigationService, localConfig.maxItems]);

  const getThemeClass = () => {
    const { theme } = localConfig;
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  // Debug: Log config and computed className on each render
  const navClassName = `navigation-menu position-${localConfig.menuPosition} theme-${getThemeClass()}`;
  console.log('[NavigationMenu] Render', { localConfig, navClassName });

  return (
    <nav className={navClassName}>
      <div className="nav-header">
        <button 
          className="nav-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </div>
      
      <ul className={`nav-list ${isCollapsed ? 'collapsed' : ''}`}>
        {menuItems.map((item) => {
          const LucideIcon = item.icon ? getLucideIcon(item.icon) : null;
          return (
            <li key={item.id  + Math.random()* 10000} className="nav-item">
              <a href={item.path} className="nav-link">
                {localConfig.showIcons && LucideIcon && (
                  <span className={`icon icon-${item.icon}`}>
                    <LucideIcon size={18} />
                  </span>
                )}
                <span className="nav-text">{item.title}</span>
              </a>
              {item.children && item.children.length > 0 && (
                <ul className="nav-submenu">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon ? getLucideIcon(child.icon) : null;
                    return (
                      <li key={item.id + '-' + child.id} className="nav-subitem">
                        <a href={child.path} className="nav-link">
                          {localConfig.showIcons && ChildIcon && (
                            <span className={`icon icon-${child.icon}`}>
                              <ChildIcon size={16} />
                            </span>
                          )}
                          <span className="nav-text">{child.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
