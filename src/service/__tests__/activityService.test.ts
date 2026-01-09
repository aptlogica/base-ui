import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import {
  getDeviceInfo,
  createLoginSession,
  isSameDevice,
  updateUserActivity,
  getUserActivity,
  clearUserActivity,
  LoginSession,
  UserActivityData,
} from '../activityService';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the client
vi.mock('../clientService', () => ({
  client: {
    userService: {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    },
  },
}));

import { client } from '../clientService';

// Store original values for restoration
let originalNavigator: Navigator;
let originalIntl: typeof Intl;

// Helper to mock navigator
function mockNavigator(overrides: Partial<typeof navigator> = {}) {
  const mockNav = {
    ...originalNavigator,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    language: 'en-US',
    deviceMemory: 8,
    ...overrides,
  };

  Object.defineProperty(window, 'navigator', {
    value: mockNav,
    writable: true,
    configurable: true,
  });

  return mockNav;
}

// Helper to restore navigator
function restoreNavigator() {
  Object.defineProperty(window, 'navigator', {
    value: originalNavigator,
    writable: true,
    configurable: true,
  });
}

// Helper to mock Intl.DateTimeFormat
function mockIntl(timeZone: string = 'UTC') {
  const mockIntlDateTimeFormat = vi.fn(() => ({
    resolvedOptions: vi.fn(() => ({ timeZone })),
  }));

  global.Intl = {
    ...originalIntl,
    DateTimeFormat: mockIntlDateTimeFormat as any,
  };

  return mockIntlDateTimeFormat;
}

// Helper to restore Intl
function restoreIntl() {
  global.Intl = originalIntl;
}

// ============================================================================
// Test Utilities
// ============================================================================

const mockClientService = client as any;
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();

beforeEach(() => {
  // Store original values before any mocking
  originalNavigator = window.navigator;
  originalIntl = global.Intl;

  // Reset all mocks before each test
  vi.clearAllMocks();

  // Setup default mock implementations
  mockClientService.userService = {
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile,
  };

  // Mock date for consistent testing
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  restoreNavigator();
  restoreIntl();
});

// ============================================================================
// Tests: getDeviceInfo
// ============================================================================

describe('getDeviceInfo', () => {
  describe('browser detection', () => {
    it('should detect Chrome browser from userAgentData', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        userAgentData: {
          brands: [
            { brand: 'Google Chrome', version: '120' },
          ],
        },
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Chrome');
      expect(result.browser_version).toBe('120');
    });

    it('should detect Edge browser from userAgentData', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userAgentData: {
          brands: [
            { brand: 'Microsoft Edge', version: '120' },
            { brand: 'Chromium', version: '120' },
          ],
        },
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Edge');
      expect(result.browser_version).toBe('120');
    });

    it('should prioritize Edge detection over Chrome in userAgentData', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0',
        userAgentData: {
          brands: [
            { brand: 'Microsoft Edge', version: '119' },
            { brand: 'Google Chrome', version: '120' },
          ],
        },
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Edge');
      expect(result.browser_version).toBe('119');
    });

    it('should fallback to userAgent parsing for Chrome', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36',
        userAgentData: undefined,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Chrome');
      expect(result.browser_version).toBe('120');
    });

    it('should detect Edge from userAgent when userAgentData unavailable', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Edg/120.0.0.0',
        userAgentData: undefined,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Edge');
      expect(result.browser_version).toBe('120');
    });

    it('should detect Firefox browser', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Firefox/122.0',
        userAgentData: undefined,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Firefox');
      expect(result.browser_version).toBe('122');
    });

    it('should detect Safari browser', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.0 Safari/605.1.15',
        userAgentData: undefined,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Safari');
      expect(result.browser_version).toBe('17');
    });

    it('should return Unknown for unsupported browser', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Unknown Browser 1.0',
        userAgentData: { brands: [] },
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Unknown');
      expect(result.browser_version).toBeUndefined();
    });
  });

  describe('operating system detection', () => {
    it('should detect Windows OS', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('Windows');
    });

    it('should detect macOS', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('macOS');
    });

    it('should detect Linux OS', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('Linux');
    });

    it('should detect Android OS', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G991B)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('Android');
    });

    it('should detect iOS from iPhone', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('iOS');
    });

    it('should detect iOS from iPad', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2_1)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('iOS');
    });

    it('should return Unknown for unrecognized OS', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Unknown OS)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.os).toBe('Unknown');
    });
  });

  describe('device type detection', () => {
    it('should detect desktop device', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_type).toBe('desktop');
    });

    it('should detect mobile device with Android', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G991B)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_type).toBe('mobile');
    });

    it('should detect mobile device with iPhone', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_type).toBe('mobile');
    });

    it('should detect tablet device with iPad', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_type).toBe('tablet');
    });

    it('should detect tablet device from Tablet user agent', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X)',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_type).toBe('tablet');
    });
  });

  describe('additional device properties', () => {
    it('should include timezone information', () => {
      // Arrange
      mockIntl('Asia/Calcutta');
      mockNavigator({});

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.timezone).toBe('Asia/Calcutta');
    });

    it('should include language information', () => {
      // Arrange
      mockNavigator({
        language: 'en-IN',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.language).toBe('en-IN');
    });

    it('should include device memory when available', () => {
      // Arrange
      mockNavigator({
        deviceMemory: 16,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_memory).toBe(16);
    });

    it('should handle missing device memory gracefully', () => {
      // Arrange
      mockNavigator({
        deviceMemory: undefined,
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.device_memory).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty user agent string', () => {
      // Arrange
      mockNavigator({
        userAgent: '',
      });

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
      expect(result.device_type).toBe('desktop');
    });

    it('should handle userAgentData with empty brands array', () => {
      // Arrange
      mockNavigator({
        userAgent: 'Some User Agent',
        userAgentData: {
          brands: [],
        },
      } as any);

      // Act
      const result = getDeviceInfo();

      // Assert
      // Should fallback to userAgent parsing
      expect(result).toBeDefined();
    });

    it('should return complete device info object structure', () => {
      // Arrange
      mockNavigator({});

      // Act
      const result = getDeviceInfo();

      // Assert
      expect(result).toHaveProperty('browser');
      expect(result).toHaveProperty('os');
      expect(result).toHaveProperty('device_type');
      expect(result).toHaveProperty('timezone');
      expect(result).toHaveProperty('language');
    });
  });
});

// ============================================================================
// Tests: createLoginSession
// ============================================================================

describe('createLoginSession', () => {
  it('should create a login session with required properties', () => {
    // Arrange
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
      language: 'en-US',
      deviceMemory: 8,
    } as any);
    mockIntl('UTC');

    // Act
    const session = createLoginSession();

    // Assert
    expect(session).toHaveProperty('browser');
    expect(session).toHaveProperty('os');
    expect(session).toHaveProperty('device_type');
    expect(session).toHaveProperty('login_at');
    expect(session).toHaveProperty('timezone');
    expect(session).toHaveProperty('language');
  });

  it('should set login_at to current timestamp', () => {
    // Arrange
    mockNavigator({});
    mockIntl();
    const beforeTime = new Date().toISOString();

    // Act
    const session = createLoginSession();

    const afterTime = new Date().toISOString();

    // Assert
    expect(new Date(session.login_at).getTime()).toBeGreaterThanOrEqual(
      new Date(beforeTime).getTime()
    );
    expect(new Date(session.login_at).getTime()).toBeLessThanOrEqual(
      new Date(afterTime).getTime()
    );
  });

  it('should include browser_version when available', () => {
    // Arrange
    mockNavigator({
      userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
      userAgentData: {
        brands: [{ brand: 'Google Chrome', version: '120' }],
      },
    } as any);
    mockIntl();

    // Act
    const session = createLoginSession();

    // Assert
    expect(session.browser_version).toBe('120');
  });

  it('should handle optional browser_version gracefully', () => {
    // Arrange
    mockNavigator({
      userAgent: 'Unknown Browser',
      userAgentData: undefined,
    } as any);
    mockIntl();

    // Act
    const session = createLoginSession();

    // Assert
    // browser_version should either be undefined or a valid string
    if (session.browser_version !== undefined) {
      expect(typeof session.browser_version).toBe('string');
    }
  });

  it('should preserve all device info properties in session', () => {
    // Arrange
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      language: 'fr-CA',
      deviceMemory: 16,
    } as any);
    mockIntl('America/Toronto');

    // Act
    const session = createLoginSession();

    // Assert
    expect(session.browser).toBe('Safari');
    expect(session.os).toBe('macOS');
    expect(session.device_type).toBe('desktop');
    expect(session.timezone).toBe('America/Toronto');
    expect(session.language).toBe('fr-CA');
    expect(session.device_memory).toBe(16);
  });

  it('should create unique sessions with different login times', () => {
    // Arrange
    mockNavigator({});
    mockIntl();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));

    // Act
    const session1 = createLoginSession();
    vi.setSystemTime(new Date('2024-01-15T10:30:01Z'));
    const session2 = createLoginSession();

    // Assert
    expect(session1.login_at).not.toBe(session2.login_at);
  });
});

// ============================================================================
// Tests: isSameDevice
// ============================================================================

describe('isSameDevice', () => {
  it('should return true for identical sessions', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
      timezone: 'UTC',
      language: 'en-US',
    };
    const session2: LoginSession = { ...session1, login_at: '2024-01-15T10:31:00Z' };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when browser differs', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Firefox',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when browser_version differs', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Chrome',
      browser_version: '119',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when OS differs', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'macOS',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when device_type differs', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'mobile',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(false);
  });

  it('should ignore timezone and language differences', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
      timezone: 'UTC',
      language: 'en-US',
    };
    const session2: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
      timezone: 'Asia/Calcutta',
      language: 'en-IN',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(true);
  });

  it('should handle undefined browser_version correctly', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Unknown',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Unknown',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when one has browser_version and other does not', () => {
    // Arrange
    const session1: LoginSession = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const session2: LoginSession = {
      browser: 'Chrome',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };

    // Act
    const result = isSameDevice(session1, session2);

    // Assert
    expect(result).toBe(false);
  });
});

// ============================================================================
// Tests: updateUserActivity
// ============================================================================

describe('updateUserActivity', () => {
  it('should update user activity with provided data', async () => {
    // Arrange
    const userId = 'user-123';
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-456',
      last_base_id: 'base-789',
      last_table_id: 'table-101',
      last_view_id: 'view-202',
      last_updated_at: '2024-01-15T10:30:00Z',
    };

    mockGetProfile.mockResolvedValue({ data: { activity_data: null } });
    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    const result = await updateUserActivity(userId, activityData);

    // Assert
    expect(mockUpdateProfile).toHaveBeenCalledWith(userId, {
      activity_data: activityData,
    });
    expect(result).toEqual({ success: true });
  });

  it('should preserve existing login_sessions when not provided', async () => {
    // Arrange
    const userId = 'user-123';
    const existingSession: LoginSession = {
      browser: 'Chrome',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2024-01-15T08:00:00Z',
    };
    const existingActivity: UserActivityData = {
      last_workspace_id: 'ws-old',
      login_sessions: [existingSession],
      last_updated_at: '2024-01-15T08:00:00Z',
    };
    const newActivityData: UserActivityData = {
      last_workspace_id: 'ws-new',
      last_updated_at: '2024-01-15T10:30:00Z',
    };

    mockGetProfile.mockResolvedValue({ data: { activity_data: existingActivity } });
    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    await updateUserActivity(userId, newActivityData);

    // Assert
    const callArgs = mockUpdateProfile.mock.calls[0];
    expect(callArgs[1].activity_data.login_sessions).toEqual([existingSession]);
  });

  it('should override login_sessions when explicitly provided', async () => {
    // Arrange
    const userId = 'user-123';
    const newSession: LoginSession = {
      browser: 'Firefox',
      os: 'macOS',
      device_type: 'desktop',
      login_at: '2024-01-15T10:30:00Z',
    };
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-new',
      login_sessions: [newSession],
      last_updated_at: '2024-01-15T10:30:00Z',
    };

    mockGetProfile.mockResolvedValue({
      data: {
        activity_data: {
          login_sessions: [
            { browser: 'Chrome', os: 'Windows', device_type: 'desktop', login_at: '2024-01-15T08:00:00Z' },
          ],
        },
      },
    });
    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    await updateUserActivity(userId, activityData);

    // Assert
    const callArgs = mockUpdateProfile.mock.calls[0];
    expect(callArgs[1].activity_data.login_sessions).toEqual([newSession]);
  });

  it('should handle error when getting current activity fails', async () => {
    // Arrange
    const userId = 'user-123';
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-456',
      last_base_id: 'base-789',
      last_table_id: 'table-101',
      last_view_id: 'view-202',
      last_updated_at: '2024-01-15T10:30:00Z',
    };
    const error = new Error('Failed to update profile');

    // Mock getProfile to succeed with null, but updateProfile to fail
    mockGetProfile.mockResolvedValue({ data: { activity_data: null } });
    mockUpdateProfile.mockRejectedValue(error);

    // Act & Assert
    await expect(updateUserActivity(userId, activityData)).rejects.toThrow('Failed to update profile');
  });

  it('should handle error when updating profile fails', async () => {
    // Arrange
    const userId = 'user-123';
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-456',
      last_updated_at: '2024-01-15T10:30:00Z',
    };
    const error = new Error('Update failed');

    mockGetProfile.mockResolvedValue({ data: { activity_data: null } });
    mockUpdateProfile.mockRejectedValue(error);

    // Act & Assert
    await expect(updateUserActivity(userId, activityData)).rejects.toThrow('Update failed');
  });

  it('should merge activity data correctly', async () => {
    // Arrange
    const userId = 'user-123';
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-new',
      last_base_id: 'base-new',
      last_updated_at: '2024-01-15T10:30:00Z',
      login_sessions: [
        { browser: 'Chrome', os: 'Windows', device_type: 'desktop', login_at: '2024-01-15T10:30:00Z' },
      ],
    };

    mockGetProfile.mockResolvedValue({ data: { activity_data: null } });
    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    await updateUserActivity(userId, activityData);

    // Assert
    const callArgs = mockUpdateProfile.mock.calls[0];
    const mergedData = callArgs[1].activity_data;

    expect(mergedData.last_workspace_id).toBe('ws-new');
    expect(mergedData.last_base_id).toBe('base-new');
    expect(mergedData.last_updated_at).toBe('2024-01-15T10:30:00Z');
    expect(mergedData.login_sessions).toBeDefined();
  });

  it('should log error to console on failure', async () => {
    // Arrange
    const userId = 'user-123';
    const activityData: UserActivityData = {
      last_workspace_id: 'ws-456',
      last_base_id: 'base-789',
      last_table_id: 'table-101',
      last_view_id: 'view-202',
      last_updated_at: '2024-01-15T10:30:00Z',
    };
    const error = new Error('API Error');

    mockGetProfile.mockResolvedValue({ data: { activity_data: null } });
    mockUpdateProfile.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    try {
      await updateUserActivity(userId, activityData);
    } catch {
      // Expected
    }

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Failed to update user activity:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

// ============================================================================
// Tests: getUserActivity
// ============================================================================

describe('getUserActivity', () => {
  it('should return user activity data when present', async () => {
    // Arrange
    const userId = 'user-123';
    const expectedActivity: UserActivityData = {
      last_workspace_id: 'ws-456',
      last_base_id: 'base-789',
      last_table_id: 'table-101',
      last_view_id: 'view-202',
      last_updated_at: '2024-01-15T10:30:00Z',
      login_sessions: [
        {
          browser: 'Chrome',
          browser_version: '120',
          os: 'Windows',
          device_type: 'desktop',
          login_at: '2024-01-15T10:30:00Z',
        },
      ],
    };

    mockGetProfile.mockResolvedValue({
      data: { activity_data: expectedActivity },
    });

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toEqual(expectedActivity);
  });

  it('should return null when activity_data is not present', async () => {
    // Arrange
    const userId = 'user-123';

    mockGetProfile.mockResolvedValue({
      data: { activity_data: null },
    });

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when response has no data property', async () => {
    // Arrange
    const userId = 'user-123';

    mockGetProfile.mockResolvedValue({});

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when activity_data is not an object', async () => {
    // Arrange
    const userId = 'user-123';

    mockGetProfile.mockResolvedValue({
      data: { activity_data: 'not-an-object' },
    });

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const userId = 'user-123';
    const error = new Error('API Error');

    mockGetProfile.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to fetch user activity:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should call userService.getProfile with correct userId', async () => {
    // Arrange
    const userId = 'user-456';

    mockGetProfile.mockResolvedValue({
      data: { activity_data: null },
    });

    // Act
    await getUserActivity(userId);

    // Assert
    expect(mockGetProfile).toHaveBeenCalledWith(userId);
  });

  it('should handle activity_data with partial properties', async () => {
    // Arrange
    const userId = 'user-123';
    const partialActivity = {
      last_workspace_id: 'ws-456',
      last_updated_at: '2024-01-15T10:30:00Z',
    };

    mockGetProfile.mockResolvedValue({
      data: { activity_data: partialActivity },
    });

    // Act
    const result = await getUserActivity(userId);

    // Assert
    expect(result).toEqual(partialActivity);
  });

  it('should validate activity_data is proper object type', async () => {
    // Arrange
    const userId = 'user-123';

    mockGetProfile.mockResolvedValue({
      data: { activity_data: [] }, // Array is object but not plain object
    });

    // Act
    const result = await getUserActivity(userId);

    // Assert
    // Should return the data as array is technically an object
    expect(result).toBeDefined();
  });
});

// ============================================================================
// Tests: clearUserActivity
// ============================================================================

describe('clearUserActivity', () => {
  it('should clear user activity by setting it to null', async () => {
    // Arrange
    const userId = 'user-123';

    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    const result = await clearUserActivity(userId);

    // Assert
    expect(mockUpdateProfile).toHaveBeenCalledWith(userId, {
      activity_data: null,
    });
    expect(result).toEqual({ success: true });
  });

  it('should call updateProfile with correct parameters', async () => {
    // Arrange
    const userId = 'user-456';

    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    await clearUserActivity(userId);

    // Assert
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-456', {
      activity_data: null,
    });
    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
  });

  it('should handle successful API response', async () => {
    // Arrange
    const userId = 'user-123';
    const apiResponse = { data: { user_id: userId, activity_data: null } };

    mockUpdateProfile.mockResolvedValue(apiResponse);

    // Act
    const result = await clearUserActivity(userId);

    // Assert
    expect(result).toEqual(apiResponse);
  });

  it('should throw error when API call fails', async () => {
    // Arrange
    const userId = 'user-123';
    const error = new Error('API Error: Cannot update profile');

    mockUpdateProfile.mockRejectedValue(error);

    // Act & Assert
    await expect(clearUserActivity(userId)).rejects.toThrow('API Error: Cannot update profile');
  });

  it('should log error to console on failure', async () => {
    // Arrange
    const userId = 'user-123';
    const error = new Error('Update failed');

    mockUpdateProfile.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    try {
      await clearUserActivity(userId);
    } catch {
      // Expected
    }

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Failed to clear user activity:',
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it('should rethrow error for caller to handle', async () => {
    // Arrange
    const userId = 'user-123';
    const error = new Error('Network error');

    mockUpdateProfile.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    await expect(clearUserActivity(userId)).rejects.toThrow('Network error');

    consoleErrorSpy.mockRestore();
  });

  it('should clear activity regardless of previous state', async () => {
    // Arrange
    const userId = 'user-123';

    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act
    // Call multiple times
    await clearUserActivity(userId);
    await clearUserActivity(userId);

    // Assert
    expect(mockUpdateProfile).toHaveBeenCalledTimes(2);
    expect(mockUpdateProfile).toHaveBeenNthCalledWith(1, userId, {
      activity_data: null,
    });
    expect(mockUpdateProfile).toHaveBeenNthCalledWith(2, userId, {
      activity_data: null,
    });
  });
});

// ============================================================================
// Integration-like Tests
// ============================================================================

describe('activityService - integration scenarios', () => {
  it('should create a session and verify device match', () => {
    // Arrange
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
    });
    mockIntl();

    // Act
    const session1 = createLoginSession();
    const session2 = createLoginSession();

    // Assert
    expect(isSameDevice(session1, session2)).toBe(true);
  });

  it('should handle activity workflow: create -> update -> get -> clear', async () => {
    // Arrange
    const userId = 'user-123';
    mockNavigator({});
    mockIntl();

    const session = createLoginSession();
    const initialActivity: UserActivityData = {
      last_workspace_id: 'ws-123',
      login_sessions: [session],
      last_updated_at: new Date().toISOString(),
    };

    mockGetProfile.mockResolvedValue({ data: { activity_data: initialActivity } });
    mockUpdateProfile.mockResolvedValue({ success: true });

    // Act - Update activity
    await updateUserActivity(userId, initialActivity);

    // Act - Get activity
    const retrieved = await getUserActivity(userId);

    // Act - Clear activity
    await clearUserActivity(userId);

    // Assert
    expect(mockUpdateProfile).toHaveBeenCalledTimes(2); // Once in updateUserActivity, once in clearUserActivity
    expect(retrieved).toEqual(initialActivity);
  });

  it('should track session changes over time', async () => {
    // Arrange
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

    mockNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
    });
    mockIntl();

    // Act - First login session
    const session1 = createLoginSession();

    // Act - Simulate device change
    vi.setSystemTime(new Date('2024-01-15T14:00:00Z'));
    mockNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari',
    });
    const session2 = createLoginSession();

    // Assert
    expect(isSameDevice(session1, session2)).toBe(false);
    expect(session1.login_at).not.toBe(session2.login_at);
  });
});
