import { client } from './clientService';

export interface LoginSession {
  browser: string;
  browser_version?: string; // e.g., "142"
  os: string;
  device_type: string;
  login_at: string;
  // Additional useful info for security awareness
  timezone?: string; // e.g., "Asia/Calcutta"
  language?: string; // e.g., "en-IN"
  device_memory?: number; // e.g., 8 (in GB)
}

export interface UserActivityData {
  last_workspace_id?: string;
  last_base_id?: string;
  last_table_id?: string;
  last_view_id?: string;
  login_sessions?: LoginSession[];
  last_updated_at: string;
}

export const updateUserActivity = async (
  userId: string,
  activityData: UserActivityData,
  currentActivity?: UserActivityData | null
) => {
  try {
    // Get current activity_data to preserve login_sessions if not provided
    const existingActivity =
      currentActivity === undefined ? await getUserActivity(userId) : currentActivity;
    const mergedActivity: UserActivityData = {
      ...activityData,
      login_sessions: activityData.login_sessions ?? existingActivity?.login_sessions
    };
    
    const result = await client.userService.updateProfile(userId, {
      activity_data: mergedActivity
    });
    return result;
  } catch (error) {
    console.error('❌ Failed to update user activity:', error);
    throw error;
  }
};

// Type definitions for userAgentData API
interface NavigatorUAData {
  brands?: Array<{ brand: string; version: string }>;
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: NavigatorUAData;
  deviceMemory?: number;
}

// Helper: Extract browser info from userAgentData API
const getBrowserFromUserAgentData = (userAgentData: NavigatorUAData | undefined): { browser: string; version?: string } => {
  if (!userAgentData?.brands || userAgentData.brands.length === 0) {
    return { browser: 'Unknown' };
  }

  // Check for Microsoft Edge first (Edge is Chromium-based, so it also has Chrome/Chromium brands)
  const edgeBrand = userAgentData.brands.find(b => 
    b.brand === 'Microsoft Edge' || b.brand === 'msedge'
  );
  if (edgeBrand) {
    return { browser: 'Edge', version: edgeBrand.version };
  }

  // Then check for Chrome
  const chromeBrand = userAgentData.brands.find(b => 
    b.brand === 'Google Chrome' || b.brand === 'Chromium'
  );
  if (chromeBrand) {
    return { browser: 'Chrome', version: chromeBrand.version };
  }

  return { browser: 'Unknown' };
};

// Helper: Extract browser version from user agent string using RegExp.exec()
const extractBrowserVersion = (userAgent: string, pattern: RegExp): string | undefined => {
  const match = pattern.exec(userAgent);
  return match ? match[1] : undefined;
};

// Helper: Detect Edge browser from user agent
const detectEdgeBrowser = (userAgent: string): { browser: string; version?: string } | null => {
  if (!userAgent.includes('Edg')) return null;
  const edgePattern = /Edg\/(\d+)/;
  const version = extractBrowserVersion(userAgent, edgePattern);
  return { browser: 'Edge', version };
};

// Helper: Detect Chrome browser from user agent
const detectChromeBrowser = (userAgent: string): { browser: string; version?: string } | null => {
  const hasChrome = userAgent.includes('Chrome');
  const hasEdge = userAgent.includes('Edg');
  if (!hasChrome || hasEdge) return null;
  const chromePattern = /Chrome\/(\d+)/;
  const version = extractBrowserVersion(userAgent, chromePattern);
  return { browser: 'Chrome', version };
};

// Helper: Detect Firefox browser from user agent
const detectFirefoxBrowser = (userAgent: string): { browser: string; version?: string } | null => {
  if (!userAgent.includes('Firefox')) return null;
  const firefoxPattern = /Firefox\/(\d+)/;
  const version = extractBrowserVersion(userAgent, firefoxPattern);
  return { browser: 'Firefox', version };
};

// Helper: Detect Safari browser from user agent
const detectSafariBrowser = (userAgent: string): { browser: string; version?: string } | null => {
  const hasSafari = userAgent.includes('Safari');
  const hasChrome = userAgent.includes('Chrome');
  if (!hasSafari || hasChrome) return null;
  const safariPattern = /Version\/(\d+)/;
  const version = extractBrowserVersion(userAgent, safariPattern);
  return { browser: 'Safari', version };
};

// Helper: Detect browser from user agent string
const detectBrowserFromUserAgent = (userAgent: string): { browser: string; version?: string } => {
  const edgeResult = detectEdgeBrowser(userAgent);
  if (edgeResult) return edgeResult;
  
  const chromeResult = detectChromeBrowser(userAgent);
  if (chromeResult) return chromeResult;
  
  const firefoxResult = detectFirefoxBrowser(userAgent);
  if (firefoxResult) return firefoxResult;
  
  const safariResult = detectSafariBrowser(userAgent);
  if (safariResult) return safariResult;
  
  return { browser: 'Unknown' };
};

// Helper: Detect operating system from user agent
const detectOS = (userAgent: string): string => {
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux') && !userAgent.includes('Android')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// Helper: Detect device type from user agent
const detectDeviceType = (userAgent: string): string => {
  if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'tablet';
  return 'desktop';
};

/**
 * Get device info from browser (simple, no API calls)
 */
export function getDeviceInfo(): { 
  browser: string; 
  browser_version?: string;
  os: string; 
  device_type: string;
  timezone?: string;
  language?: string;
  device_memory?: number;
} {
  const ua = navigator.userAgent;
  const navigatorWithUAData = navigator as NavigatorWithUAData;
  
  // Try to get browser version from userAgentData first (more accurate)
  // IMPORTANT: Check for Edge FIRST since Edge is Chromium-based and contains Chrome/Chromium brands
  let browserInfo = getBrowserFromUserAgentData(navigatorWithUAData.userAgentData);
  
  // Fallback to userAgent parsing (check Edge BEFORE Chrome since Edge UA contains "Chrome")
  if (browserInfo.browser === 'Unknown') {
    browserInfo = detectBrowserFromUserAgent(ua);
  }
  
  const os = detectOS(ua);
  const device_type = detectDeviceType(ua);
  
  // Get additional info
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const device_memory = navigatorWithUAData.deviceMemory;
  
  return { 
    browser: browserInfo.browser, 
    browser_version: browserInfo.version,
    os, 
    device_type,
    timezone,
    language,
    device_memory
  };
}

/**
 * Create a login session from current device info
 */
export function createLoginSession(): LoginSession {
  const deviceInfo = getDeviceInfo();
  
  return {
    browser: deviceInfo.browser,
    browser_version: deviceInfo.browser_version,
    os: deviceInfo.os,
    device_type: deviceInfo.device_type,
    login_at: new Date().toISOString(),
    timezone: deviceInfo.timezone,
    language: deviceInfo.language,
    device_memory: deviceInfo.device_memory
  };
}

/**
 * Check if two login sessions are from the same device
 * Compares browser, browser_version, os, and device_type
 */
export function isSameDevice(session1: LoginSession, session2: LoginSession): boolean {
  return (
    session1.browser === session2.browser &&
    session1.browser_version === session2.browser_version &&
    session1.os === session2.os &&
    session1.device_type === session2.device_type
  );
}

export const getUserActivity = async (userId: string): Promise<UserActivityData | null> => {
  try {
    const profile = await client.userService.getProfile(userId);
    const activityData = profile.data?.activity_data;
    
    if (activityData && typeof activityData === 'object') {
      return activityData as UserActivityData;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return null;
  }
};

export const clearUserActivity = async (userId: string) => {
  try {
    const result = await client.userService.updateProfile(userId, {
      activity_data: null
    });
    return result;
  } catch (error) {
    console.error('Failed to clear user activity:', error);
    throw error;
  }
};
