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

export const updateUserActivity = async (userId: string, activityData: UserActivityData) => {
  try {
    // Get current activity_data to preserve login_sessions if not provided
    const currentActivity = await getUserActivity(userId);
    const mergedActivity: UserActivityData = {
      ...activityData,
      login_sessions: activityData.login_sessions !== undefined 
        ? activityData.login_sessions 
        : currentActivity?.login_sessions
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
  
  let browser = 'Unknown';
  let browser_version: string | undefined;
  
  // Try to get browser version from userAgentData first (more accurate)
  // IMPORTANT: Check for Edge FIRST since Edge is Chromium-based and contains Chrome/Chromium brands
  const userAgentData = (navigator as any).userAgentData;
  if (userAgentData?.brands && userAgentData.brands.length > 0) {
    // Check for Microsoft Edge first (Edge is Chromium-based, so it also has Chrome/Chromium brands)
    const edgeBrand = userAgentData.brands.find((b: any) => 
      b.brand === 'Microsoft Edge' || b.brand === 'msedge'
    );
    if (edgeBrand) {
      browser = 'Edge';
      browser_version = edgeBrand.version;
    } else {
      // Then check for Chrome
      const chromeBrand = userAgentData.brands.find((b: any) => 
        b.brand === 'Google Chrome' || b.brand === 'Chromium'
      );
      if (chromeBrand) {
        browser = 'Chrome';
        browser_version = chromeBrand.version;
      }
    }
  }
  
  // Fallback to userAgent parsing (check Edge BEFORE Chrome since Edge UA contains "Chrome")
  if (browser === 'Unknown') {
    if (ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      if (match) browser_version = match[1];
    } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) browser_version = match[1];
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) browser_version = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      if (match) browser_version = match[1];
    }
  }
  
  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  let device_type = 'desktop';
  if (/Mobile|Android|iPhone/.test(ua)) device_type = 'mobile';
  else if (/Tablet|iPad/.test(ua)) device_type = 'tablet';
  
  // Get additional info
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const device_memory = (navigator as any).deviceMemory; // in GB
  
  return { 
    browser, 
    browser_version,
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
    console.error('❌ Failed to fetch user activity:', error);
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
    console.error('❌ Failed to clear user activity:', error);
    throw error;
  }
};
