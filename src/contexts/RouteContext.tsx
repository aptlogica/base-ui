import React, { createContext, useContext, useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

export type RouteType = 
  | 'homepage' 
  | 'administrator' 
  | 'view' 
  | 'public'
  | 'unknown';

export interface RouteContextValue {
  routeType: RouteType;
  pathname: string;
  params: Record<string, string>;
  isVisible: (componentId: string) => boolean;
}

// Component IDs for type safety
export const COMPONENT_IDS = {
  HEADER_MEMBERS: 'header-members',
  WORKSPACE_DROPDOWN: 'workspace-dropdown',
  BREADCRUMB: 'breadcrumb',
  ADMINISTRATOR_SETTINGS_BUTTON: 'administrator-settings-button',
  USER_DROPDOWN: 'user-dropdown',
} as const;

const RouteContext = createContext<RouteContextValue | null>(null);

function normalizeParams(params: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => typeof value === 'string')
  ) as Record<string, string>;
}

// Route patterns configuration
const ROUTE_PATTERNS = {
  homepage: [
    '/homepage',
    '/',
    '/workspace',
    { path: '/workspace/:workspaceId', exact: true }, // Exact match only (no sub-routes)
  ],
  administrator: [
    { path: '/workspace/:workspaceId/administrator' },
    { path: '/administrator' },
  ],
  view: [
    { path: '/base/:baseId/table/:tableId/:viewId' },
    { path: '/table/:tableId/:viewId' },
  ]
} as const;

// Component visibility rules by route type
const VISIBILITY_RULES: Record<RouteType, {
  visible: string[];
  hidden: string[];
}> = {
  homepage: {
    visible: ['workspace-dropdown', 'administrator-settings-button'],
    hidden: ['header-members', 'breadcrumb'],
  },
  administrator: {
    visible: ['administrator-settings-button'],
    hidden: ['header-members', 'workspace-dropdown', 'breadcrumb'],
  },
  view: {
    visible: ['header-members', 'breadcrumb'],
    hidden: ['workspace-dropdown', 'administrator-settings-button'],
  },
  public: {
    visible: [],
    hidden: ['header-members', 'workspace-dropdown', 'breadcrumb', 'administrator-settings-button'],
  },
  unknown: {
    visible: [],
    hidden: [],
  },
};

/**
 * Determine the route type based on the current pathname
 */
function determineRouteType(pathname: string): RouteType {
  // Check in priority order (most specific first)
  
  // Administrator pages
  for (const pattern of ROUTE_PATTERNS.administrator) {
    const match = matchPath(
      typeof pattern === 'string' ? { path: pattern } : pattern,
      pathname
    );
    if (match) return 'administrator';
  }
  
  // View pages
  for (const pattern of ROUTE_PATTERNS.view) {
    const match = matchPath(
      typeof pattern === 'string' ? { path: pattern } : pattern,
      pathname
    );
    if (match) return 'view';
  }
  
  
  // Homepage (check last to avoid false matches)
  for (const pattern of ROUTE_PATTERNS.homepage) {
    if (typeof pattern === 'string') {
      if (pathname === pattern) return 'homepage';
    } else {
      const match = matchPath(pattern, pathname);
      if (match) return 'homepage';
    }
  }
  
  return 'unknown';
}

export const RouteContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const routeType = useMemo(() => determineRouteType(location.pathname), [location.pathname]);
  
  // Extract route params
  const params = useMemo(() => {
    const allPatterns = [
      ...ROUTE_PATTERNS.view,
      ...ROUTE_PATTERNS.administrator,
      ...ROUTE_PATTERNS.homepage.filter(p => typeof p !== 'string'),
    ];
    
    for (const pattern of allPatterns) {
      const match = matchPath(
        typeof pattern === 'string' ? { path: pattern } : pattern,
        location.pathname
      );
      if (match?.params) {
        return normalizeParams(match.params);
      }
    }
    return {};
  }, [location.pathname]);
  
  const isVisible = useMemo(() => {
    const rules = VISIBILITY_RULES[routeType] || VISIBILITY_RULES.unknown;
    return (componentId: string): boolean => {
      // If explicitly hidden, return false
      if (rules.hidden.includes(componentId)) {
        return false;
      }
      // If explicitly visible, return true
      if (rules.visible.includes(componentId)) {
        return true;
      }
      // Default: show if not in any config (backward compatibility)
      return true;
    };
  }, [routeType]);
  
  const value = useMemo(() => ({
    routeType,
    pathname: location.pathname,
    params,
    isVisible,
  }), [routeType, location.pathname, params, isVisible]);
  
  return (
    <RouteContext.Provider value={value}>
      {children}
    </RouteContext.Provider>
  );
};

/**
 * Hook to access route context
 */
export function useRouteContext(): RouteContextValue {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRouteContext must be used within RouteContextProvider');
  }
  return context;
}

/**
 * Convenience hook for component visibility (route-based only)
 * Components should combine this with their own role/permission checks
 */
export function useComponentVisibility(componentId: string): boolean {
  const { isVisible } = useRouteContext();
  return isVisible(componentId);
}

