// @ts-ignore - SDK module does not have type declarations
import { SereniBaseClient } from '../../sdk/index.esm.js';
import { WorkspaceBaseInput } from "../types/interfaces/workspace.interface.js";
import { decodeJwt } from 'jose';
import { LoginParams, RegisterParams, VerifyOtpParams, ResendOtpParams } from '../types/interfaces/auth.js';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  refresh_expires_at?: number;
}

// Secure token storage using sessionStorage with encryption-like obfuscation
const STORAGE_KEY = '_st_'; // Shortened key name
const REFRESH_KEY = '_rt_';

// Simple obfuscation (not real encryption - for production use proper encryption)
const obfuscate = (data: string): string => {
  return btoa(data).split('').reverse().join('');
};

const deobfuscate = (data: string): string => {
  try {
    return atob(data.split('').reverse().join(''));
  } catch {
    return '';
  }
};

// Use Vite env variable for API base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

/**
 * Stores access and refresh tokens securely in sessionStorage with obfuscation
 * @param tokenData - Token data containing access_token, refresh_token, and expiry times
 */
const storeTokenSecurely = (tokenData: TokenData): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, obfuscate(tokenData.access_token));
    if (tokenData.refresh_token) {
      sessionStorage.setItem(REFRESH_KEY, obfuscate(tokenData.refresh_token));
    }
    if (tokenData.expires_at) {
      sessionStorage.setItem('_te_', tokenData.expires_at.toString());
    }
    if (tokenData.refresh_expires_at) {
      sessionStorage.setItem('_rte_', tokenData.refresh_expires_at.toString());
    }
  } catch (error) {
    console.error('Error storing tokens securely:', error);
  }
};

/**
 * Retrieves the stored access token from sessionStorage
 * @returns The access token string, or empty string if not found
 */
export const getStoredAccessToken = (): string => {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    return token ? deobfuscate(token) : '';
  } catch {
    return '';
  }
};

/**
 * Retrieves the stored refresh token from sessionStorage
 * @returns The refresh token string, or empty string if not found
 */
export const getStoredRefreshToken = (): string => {
  try {
    const token = sessionStorage.getItem(REFRESH_KEY);
    return token ? deobfuscate(token) : '';
  } catch {
    return '';
  }
};

/**
 * Retrieves the access token expiry timestamp from sessionStorage
 * @returns The expiry timestamp in seconds, or 0 if not found
 */
const getTokenExpiry = (): number => {
  try {
    const expiry = sessionStorage.getItem('_te_');
    return expiry ? parseInt(expiry) : 0;
  } catch {
    return 0;
  }
};

/**
 * Retrieves the refresh token expiry timestamp from sessionStorage
 * @returns The expiry timestamp in seconds, or 0 if not found
 */
const getRefreshTokenExpiry = (): number => {
  try {
    const expiry = sessionStorage.getItem('_rte_');
    return expiry ? parseInt(expiry) : 0;
  } catch {
    return 0;
  }
};

/**
 * Checks if a token is expired based on its expiry timestamp
 * Uses a 1-minute buffer to refresh tokens before actual expiry
 * @param expiryTime - Token expiry timestamp in seconds
 * @returns True if token is expired or will expire within 1 minute
 */
const isTokenExpired = (expiryTime: number): boolean => {
  if (!expiryTime) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 60; // 1 minute buffer
  return currentTime >= (expiryTime - bufferTime);
};

/**
 * Clears all stored tokens and expiry timestamps from sessionStorage
 */
const clearTokens = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem('_te_');
    sessionStorage.removeItem('_rte_');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Retrieves the access token from storage, automatically refreshing if expired
 * @returns The access token string, or empty string if refresh fails
 */
const getStoredToken = async (): Promise<string> => {
  const accessToken = getStoredAccessToken();
  const accessExpiry = getTokenExpiry();

  if (!accessToken) {
    return '';
  }

  // If no expiry stored, assume token is valid
  if (!accessExpiry || accessExpiry === 0) {
    return accessToken;
  }

  const isExpired = isTokenExpired(accessExpiry);

  // If access token is still valid, return it
  if (!isExpired) {
    return accessToken;
  }

  // Access token expired, try to refresh
  try {
    const refreshedToken = await handleTokenRefresh();
    return refreshedToken || '';
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return '';
  }
};

// Token refresh queue management to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = [];

/**
 * Processes queued token refresh requests
 * @param error - Error to reject queued requests with, or null if successful
 * @param token - Refreshed token to resolve queued requests with, or null if error
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Handles token refresh with queue management to prevent race conditions
 * If a refresh is already in progress, queues the request instead of starting a new refresh
 * @returns Promise that resolves with the refreshed access token
 */
const handleTokenRefresh = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshedToken = await refreshAccessToken();
    processQueue(null, refreshedToken);
    return refreshedToken;
  } catch (error) {
    processQueue(error, null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Refreshes the access token using the refresh token
 * Handles token rotation (new refresh token may be provided)
 * @returns The new access token string, or empty string if refresh fails
 */
const refreshAccessToken = async (): Promise<string> => {
  try {
    const refreshToken = getStoredRefreshToken();
    const refreshExpiry = getRefreshTokenExpiry();
    const userId = sessionStorage.getItem('user_id');
    const isRefreshExpired = isTokenExpired(refreshExpiry);

    // Validate refresh token and user ID
    if (!refreshToken) {
      console.error('No refresh token found in storage');
      await forceLogout();
      return '';
    }

    if (!userId) {
      console.error('No user_id found in storage');
      await forceLogout();
      return '';
    }

    if (isRefreshExpired) {
      console.error('Refresh token is expired');
      await forceLogout();
      return '';
    }

    // Call refresh endpoint
    const response = await client.auth.refreshToken({
      refresh_token: refreshToken
    });

    // Handle different possible response structures from API/SDK
    // Priority 1: response.data.data (actual API structure)
    // Priority 2: response.data (if SDK unwraps)
    // Priority 3: response.data.token (alternative structure)
    // Priority 4: response.token (non-standard)
    let newTokenData: any = null;

    if (response?.data?.data?.access_token) {
      newTokenData = response.data.data;
    } else if (response?.data?.access_token) {
      newTokenData = response.data;
    } else if (response?.data?.token?.access_token) {
      newTokenData = response.data.token;
    } else if (response?.token?.access_token) {
      newTokenData = response.token;
    }

    if (newTokenData?.access_token) {
      // Decode tokens to get expiry times
      const accessDecoded = decodeJwt(newTokenData.access_token);
      const refreshDecoded = newTokenData.refresh_token ? decodeJwt(newTokenData.refresh_token) : null;

      const accessExpiry = accessDecoded?.exp as number;
      const newRefreshExpiry = refreshDecoded?.exp as number || refreshExpiry;

      // Store new tokens (handle token rotation - use new refresh token if provided)
      const tokenData: TokenData = {
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token || refreshToken,
        expires_at: accessExpiry,
        refresh_expires_at: newRefreshExpiry
      };

      storeTokenSecurely(tokenData);
      updateClientToken(newTokenData.access_token);

      return newTokenData.access_token;
    }

    throw new Error('Invalid refresh response - no token data received');
  } catch (error: any) {
    console.error('Token refresh failed:', error);

    // Only force logout on authentication errors (401, 403)
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      await forceLogout();
    }

    return '';
  }
};


/**
 * Updates the client's authentication token
 * @param token - The access token to set
 */
export const updateClientToken = (token: string) => {
  client.setAuth(token);
};

/**
 * Forces logout by clearing all tokens and user data, then redirects to login
 * Dispatches 'auth_token_expired' event for components to handle
 */
export const forceLogout = async (): Promise<void> => {
  clearTokens();
  updateClientToken('');

  window.dispatchEvent(new CustomEvent('auth_token_expired'));

  // Clear all stored user and tenant data (only what we actually store)
  const keys = ['user_id', 'user_email', 'user_display_name', 'user_avatar', 'user_role', 'user_token_data'];
  keys.forEach(k => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });

  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};


/**
 * Validates that all required authentication data is present in storage
 * @returns Object with isValid boolean and array of missing field names
 */
export const validateAuthData = (): { isValid: boolean; missing: string[] } => {
  const requiredFields = [
    { key: 'user_id', name: 'User ID' }
  ];

  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = sessionStorage.getItem(field.key) || localStorage.getItem(field.key);
    if (!value || value.trim() === '') {
      missing.push(field.name);
    }
  }

  return {
    isValid: missing.length === 0,
    missing
  };
};

// Patch SereniBaseClient to always send auth/tenant headers
// Set timeout to 5 minutes (300000ms) to handle file uploads and imports that may take longer
export const client = new SereniBaseClient({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 5 * 60 * 1000, // 5 minutes for file uploads/imports
  auth: {
    type: 'bearer',
    token: '' // Will be updated after login
  },
  headers: { 'workspace': '', 'base': '' },
});

/**
 * Sets up automatic token refresh on 401 errors
 * Listens to SDK's response-error events to detect token expiry and trigger refresh
 * The SDK's HttpClient emits 'response-error' events BEFORE formatting errors,
 * allowing us to catch 401 errors and refresh tokens automatically
 */
if ((client as any).http) {
  const httpClient = (client as any).http;

  // Track if we're already refreshing to prevent multiple refresh calls
  let isRefreshingToken = false;
  let failedQueue: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = [];

  // Listen to SDK's response-error event (fires BEFORE error formatting)
  httpClient.on('response-error', async (error: any) => {
    // Check if it's a 401 token expiry error
    const is401 = error.response?.status === 401;
    const isTokenExpired = is401 && (
      error.response?.data?.error?.code === 'AUTH_VAL_1046' ||
      error.response?.data?.error?.code === 'AUTH_1046' ||
      error.response?.data?.meta?.code === 'AUTH_1046' ||
      error.message?.toLowerCase().includes('token expired') ||
      error.response?.data?.error?.message?.toLowerCase().includes('token expired')
    );

    if (isTokenExpired && !error.config?._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      error.config = error.config || {};
      error.config._retry = true;
      isRefreshingToken = true;

      try {
        const refreshedToken = await handleTokenRefresh();

        if (refreshedToken) {
          updateClientToken(refreshedToken);

          // Process queued requests
          failedQueue.forEach(({ resolve }) => resolve(null));
          failedQueue = [];
        } else {
          console.error('Token refresh failed, no token returned');
          failedQueue.forEach(({ reject }) => reject(new Error('Token refresh failed')));
          failedQueue = [];
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
      } finally {
        isRefreshingToken = false;
      }
    }
  });
} else {
  console.error('Failed to access SDK HttpClient for token refresh setup');
}

/**
 * Wrapper for API calls that ensures a fresh token before making the call
 * If a 401 error occurs, attempts to refresh the token and retry the call once
 * @param apiCall - Function that returns a Promise for the API call
 * @returns Promise that resolves with the API response
 */
const makeAuthenticatedCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    // Ensure we have a fresh token before making the call
    const token = await getStoredToken();
    if (token) {
      updateClientToken(token);
    }

    return await apiCall();
  } catch (error: any) {
    // If we get a 401, try to refresh token and retry once
    if (error?.response?.status === 401 || error?.status === 401) {
      try {
        const refreshedToken = await handleTokenRefresh();
        if (refreshedToken) {
          updateClientToken(refreshedToken);
          // Retry the API call with the new token
          return await apiCall();
        }
      } catch (refreshError) {
        // Don't force logout on refresh failure - let the error propagate
        // The calling code or PrivateRoute will handle redirect to login
      }
    }

    throw error;
  }
};

/**
 * Initializes the client with token from storage on startup
 * Called automatically when the module loads
 */
const initializeClient = async () => {
  try {
    const token = await getStoredToken();
    if (token) {
      updateClientToken(token);
    }

    // Initialize workspace and base from navigation store if available
    try {
      const { useNavigationStore } = await import('../stores/navigationStore');
      const navState = useNavigationStore.getState();
      if (navState.selectedWorkspaceId || navState.selectedBaseId) {
        updateClientWorkspaceAndBase(navState.selectedWorkspaceId, navState.selectedBaseId);
      }
    } catch (navError) {
      // Navigation store might not be available during initialization, that's okay
      console.warn('[initializeClient] Could not access navigation store:', navError);
    }
  } catch (error) {
    console.warn('Failed to initialize client token:', error);
  }
};

// Call initialization (non-blocking)
initializeClient().catch(console.warn);

/**
 * Authenticates a user with email and password
 * Stores tokens and user info in sessionStorage
 * Updates client with access token
 * @param params - Login credentials (email and password)
 * @returns The login response containing user and tenant data
 */
export async function login(params: LoginParams) {
  const response = await client.auth.login(params);
  if (!response) {
    throw new Error(response.message || 'Login failed');
  }

  if (response.data && response.data.token && response.data.token.access_token) {
    // Decode tokens to get expiry times
    const accessDecoded = decodeJwt(response.data.token.access_token);
    const refreshDecoded = response.data.token.refresh_token ? decodeJwt(response.data.token.refresh_token) : null;

    const tokenData: TokenData = {
      access_token: response.data.token.access_token,
      refresh_token: response.data.token.refresh_token || '',
      expires_at: accessDecoded?.exp as number,
      refresh_expires_at: refreshDecoded?.exp as number
    };

    // Store tokens securely
    storeTokenSecurely(tokenData);
    updateClientToken(response.data.token.access_token);

    // Store only minimal user info in sessionStorage (for instant UI render)
    if (response.data.user && response.data.user.id) {
      sessionStorage.setItem('user_id', response.data.user.id);
      if (response.data.user.email) {
        sessionStorage.setItem('user_email', response.data.user.email);
      }
      if (response.data.user.display_name) {
        sessionStorage.setItem('user_display_name', response.data.user.display_name);
      }
      if (response.data.user.avatar) {
        sessionStorage.setItem('user_avatar', response.data.user.avatar);
      }
      if (response.data.user.timezone) {
        sessionStorage.setItem('timezone', response.data.user.timezone);
      }
      if (response.data.user.country) {
        sessionStorage.setItem('country', response.data.user.country);
      }
    }

    // Store role from decoded token (single string, not array)
    if (accessDecoded?.roles) {
      const role = typeof accessDecoded.roles === 'string' 
        ? accessDecoded.roles 
        : (Array.isArray(accessDecoded.roles) ? accessDecoded.roles[0] : null);
      
      if (role) {
        sessionStorage.setItem('user_role', role);
        // Also store full token data for reference
        sessionStorage.setItem('user_token_data', JSON.stringify({
          user_id: accessDecoded.user_id,
          email: accessDecoded.email,
          roles: role,
          email_verified: accessDecoded.email_verified,
        }));
      }
    }

    // Validate that all required auth data is present
    const validation = validateAuthData();
    if (!validation.isValid) {
      console.error('Login validation failed - missing:', validation.missing);
    }
  }
  return response;
}

/**
 * Logs out the user by calling the logout API to expire tokens on the backend,
 * then clears all local tokens and client authentication
 * Always clears local tokens even if the API call fails
 */
export const logout = async (): Promise<void> => {
  try {
    // Get current refresh token BEFORE clearing it (needed for logout API call)
    const refreshToken = getStoredRefreshToken();

    // Call logout API to expire token on backend (if we have a refresh token)
    if (refreshToken) {
      try {
        await client.auth.logout({ token: refreshToken });
      } catch (error: any) {
        // Don't fail logout if API call fails - still clear local tokens
        console.warn('Logout API call failed (may already be logged out):', error?.message || error);
      }
    }
  } catch (error) {
    console.warn('Error during logout API call:', error);
  } finally {
    // Always clear local tokens and client token, regardless of API call result
    clearTokens();
    updateClientToken('');
  }
};


export async function register(params: RegisterParams) {
  const response = await client.auth.register(params);
  return response;
}

/**
 * Initiates OAuth login with an identity provider (e.g., Google, GitHub)
 * Opens a popup window for OAuth authentication
 * @param provider - The identity provider name (e.g., 'google', 'github')
 * @returns Promise that resolves with the OAuth redirect URL
 * @throws Error if popup is blocked or OAuth fails
 */
export async function loginByIdentityProvider(provider: string): Promise<{ data: { redirect_url: string } }> {
  try {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

    // Frontend callback URL - Keycloak will redirect here after OAuth
    const FRONTEND_CALLBACK_URL = `${window.location.origin}/auth/callback`;

    // Build the API URL
    const apiUrl = `${API_BASE_URL}/api/v1/auth/login/${provider}?redirect_uri=${encodeURIComponent(FRONTEND_CALLBACK_URL)}`;

    // Store the provider in sessionStorage so we can handle the callback
    sessionStorage.setItem('oauth_provider', provider);
    sessionStorage.setItem('oauth_redirect_url', window.location.href);
    sessionStorage.setItem('oauth_use_popup', 'true');

    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      // Open popup directly to the API endpoint
      // The server should redirect to the OAuth provider
      // Browser will follow redirects in popups without CORS restrictions
      const popup = window.open(
        apiUrl,
        'oauth-login',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site to sign in with OAuth.'));
        return;
      }

      // Optimized popup management with proper cleanup
      let isResolved = false;
      let checkClosedInterval: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (checkClosedInterval) {
          clearInterval(checkClosedInterval);
          checkClosedInterval = null;
        }
        window.removeEventListener('message', messageListener);
      };

      const messageListener = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (isResolved) {
          return;
        }

        if (event.data.type === 'OAUTH_SUCCESS') {
          isResolved = true;
          cleanup();
          try {
            popup.close();
          } catch (e) {
            // Popup may already be closed
          }
          resolve({ data: { redirect_url: apiUrl } });
        } else if (event.data.type === 'OAUTH_ERROR') {
          isResolved = true;
          cleanup();
          try {
            popup.close();
          } catch (e) {
            // Popup may already be closed
          }
          reject(new Error(event.data.error || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      checkClosedInterval = setInterval(() => {
        if (popup.closed && !isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error('OAuth popup was closed'));
        }
      }, 500);

      // Timeout safety - reject after 5 minutes if no response
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          try {
            popup.close();
          } catch (e) {
            // Popup may already be closed
          }
          reject(new Error('OAuth authentication timeout'));
        }
      }, 5 * 60 * 1000); // 5 minutes
    });
  } catch (error: any) {
    throw new Error(error?.message || `OAuth login with ${provider} failed`);
  }
}

export async function verifyOtp(params: VerifyOtpParams) {
  try {
    const response = await client.auth.verifyOtp(params);
    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'OTP verification failed');
  }
}

export async function resendOtp(params: ResendOtpParams) {
  try {
    const response = await client.auth.resendOtp(params);
    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to resend OTP');
  }
}

export async function forgotPassword(params: { email: string }) {
  try {
    const response = await client.auth.forgotPassword(params);
    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to send reset password email');
  }
}

export async function resetPassword(params: { token: string; new_password: string }) {
  try {
    const response = await client.auth.resetPassword(params);
    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to reset password');
  }
}

// WorkspaceService wrappers with auth/tenant headers
export async function createWorkspaceService(params: WorkspaceBaseInput) {
  return await makeAuthenticatedCall(() => client.workspace.create(params));
}

export async function getAllWorkspacesService() {
  const validation = validateAuthData();
  if (!validation.isValid) {
    throw new Error(`Missing required authentication data: ${validation.missing.join(', ')}`);
  }

  try {
    // Use userService.getWorkspaces() instead of workspace.getAll()
    // This gets workspaces for the current user
    const result = await makeAuthenticatedCall(() => client.userService.getWorkspaces());
    return result;
  } catch (error: any) {
    // Check if it's a schema-related error
    if (error.message?.includes('schema') || error.status === 400) {
      throw new Error('Workspace access denied. Please log in again to refresh your session.');
    }

    throw error;
  }
}

export async function getWorkspaceByIdService(id: string) {
  return await makeAuthenticatedCall(() => client.workspace.getById(id));
}

export async function getWorkspacesByUser() {
  return await makeAuthenticatedCall(() => client.userService.getWorkspaces());
}

export async function getTablesByWorkspaceIdService(id: string) {
  return await makeAuthenticatedCall(() => client.workspace.getTablesByWorkspaceId(id));
}

export async function updateWorkspaceService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.workspace.update(id, params));
}

export async function deleteWorkspaceService(id: string) {
  return await makeAuthenticatedCall(() => client.workspace.delete(id));
}

export async function getBasesByWorkspaceIdService(id: string) {
  return await makeAuthenticatedCall(() => client.workspace.getBasesByWorkspaceId(id));
}

export async function getWorkspaceMembersService(workspaceId: string) {
  return await makeAuthenticatedCall(() => client.workspace.getMembers(workspaceId));
}

export async function removeUserFromWorkspaceService(workspaceId: string, params: { workspace_id: string; user_id: string }) {
  return await makeAuthenticatedCall(() => client.userService.removeFromWorkspace(workspaceId, params));
}

// BaseService wrappers with auth/tenant headers
export async function createBaseService(params: any) {
  return await makeAuthenticatedCall(() => client.baseService.create(params));
}

export async function getBaseByIdService(id: string) {
  return await makeAuthenticatedCall(() => client.baseService.getById(id));
}

export async function getTablesByBaseIdService(id: string) {
  return await makeAuthenticatedCall(() => client.baseService.getTablesByBaseId(id));
}

export async function getAllBasesService() {
  return await makeAuthenticatedCall(() => client.baseService.getAll());
}

export async function updateBaseService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.baseService.update(id, params));
}

export async function deleteBaseService(id: string) {
  return await makeAuthenticatedCall(() => client.baseService.delete(id));
}

export async function getBaseMembersService(baseId: string) {
  return await makeAuthenticatedCall(() => client.baseService.getMembers(baseId));
}

// TableService wrappers with auth/tenant headers
export async function createTableService(params: any) {
  return await makeAuthenticatedCall(() => client.tableService.create(params));
}

export async function getTableByIdService(id: string, options?: any) {
  return await makeAuthenticatedCall(() => client.tableService.getById(id, options));
}

export async function getAllTablesService() {
  return await makeAuthenticatedCall(() => client.tableService.getAll());
}

// User Profile Services
export async function getUserProfileByIDService(id: string) {
  return await makeAuthenticatedCall(() => client.userService.getProfile(id));
}

export async function updateUserProfileService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.userService.updateProfile(id, params));
}

export async function getUserAccessDetailsService(userId: string, workspaceId?: string) {
  return await makeAuthenticatedCall(() => client.userService.getUserAccessDetails(userId, workspaceId));
}

export async function changePasswordService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.userService.changePassword(id, params));
}

export async function addOrUpdateAvatarService(id: string, avatarFile: File) {
  return await makeAuthenticatedCall(() => client.userService.addOrUpdateAvatar(id, avatarFile));
}

export async function removeAvatarService(id: string) {
  return await makeAuthenticatedCall(() => client.userService.removeAvatar(id));
}

export async function assignUserToWorkspaceService(params: {
  workspace_id: string;
  user_ids: string[];
  access_level: string;
  bases_ids: string;
}) {
  return await makeAuthenticatedCall(() => client.workspace.inviteUser(params.workspace_id, params));
}

export async function updateTableService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.tableService.update(id, params));
}

export async function deleteTableService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.delete(id));
}

export async function getColumnsByTableIdService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.getColumnsByTableId(id));
}

// Field/Column Service wrappers
export async function createFieldService(params: any) {
  return await makeAuthenticatedCall(() => client.tableService.addColumn(params));
}

export async function getFieldByIdService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.getColumnById(id));
}

export async function getAllFieldsService() {
  return await makeAuthenticatedCall(() => client.tableService.getAllColumns());
}

export async function updateFieldService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.tableService.updateColumn(id, params));
}

export async function deleteFieldService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.deleteColumn(id));
}

export async function reorderColumnService(params: { source_column_id: string; target_column_id: string }) {
  return await makeAuthenticatedCall(() => client.tableService.reorderColumn(params));
}

// View Service wrappers
export async function createViewService(params: any) {
  return await makeAuthenticatedCall(() => client.tableService.createView(params));
}

export async function getViewByIdService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.getViewById(id));
}

export async function getAllViewsService() {
  return await makeAuthenticatedCall(() => client.tableService.getAllViews());
}

export async function updateViewService(id: string, params: any) {
  return await makeAuthenticatedCall(() => client.tableService.updateView(id, params));
}

export async function deleteViewService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.deleteView(id));
}

export async function getViewsByModelIdService(id: string) {
  return await makeAuthenticatedCall(() => client.tableService.getViewsByModelId(id));
}

export async function addRow(model_id: string): Promise<any> {
  return await makeAuthenticatedCall(() => client.tableService.createRow({ model_id }));
}

export async function deleteRowService(params: { model_id: string; row_id: number }) {
  return await makeAuthenticatedCall(() => client.tableService.deleteRow(params));
}

export async function insertRowDataService(params: { model_id: string; column_id: string; row_id: number; value: any }) {
  return await makeAuthenticatedCall(() => client.tableService.insertRowData(params));
}

export async function getAllRecordsService(id: string, options?: { pageNumber?: number; pageLimit?: number }) {
  return await makeAuthenticatedCall(() => client.tableService.getAllRecords(id, options));
}

export async function insertRelationDataService(params: { model_id: string; column_id: string; source_row_id: number; target_row_id: number; action: 'link' | 'unlink' }) {
  return await makeAuthenticatedCall(() => client.tableService.insertRelationData(params));
}

export async function addAttachmentService(params: {
  model_id: string;
  column_id: string;
  row_id: number;
  files: File[];
  onProgress?: (progressEvent: ProgressEvent) => void;
}) {
  return await makeAuthenticatedCall(() => client.tableService.addAttachment(params, params.onProgress));
}

export async function removeAttachmentsService(params: { model_id: string; column_id: string; row_id: number; attachments: string[] }) {
  return await makeAuthenticatedCall(() => client.tableService.removeAttachments(params));
}

export async function updateAssetByIdService(id: string, params: { title?: string }) {
  return await makeAuthenticatedCall(() => client.tableService.updateAssetById(id, params));
}

export async function addImageService(files: File[], onProgress?: (progressEvent: ProgressEvent) => void) {
  return await makeAuthenticatedCall(() => client.assetService.addImage({ files }, onProgress));
}

export async function importTableService(
  params: {
    base_id: string;
    workspace_id: string;
    title: string;
    description: string;
    order_index: number;
    file: File;
  },
  onProgress?: (progressEvent: ProgressEvent) => void
) {
  return await makeAuthenticatedCall(() => client.tableService.import(params, onProgress));
}

const updateClientHeaders = (workspaceId?: string | null, baseId?: string | null) => {
  const headers: Record<string, string> = {};

  if (workspaceId !== undefined) {
    headers['workspace'] = workspaceId || '';
  }
  if (baseId !== undefined) {
    headers['base'] = baseId || '';
  }

  // setHeaders merges, so this will preserve other headers
  client.setHeaders(headers);
};

export const updateClientWorkspaceAndBase = (workspaceId: string | null, baseId: string | null) => {
  updateClientHeaders(workspaceId, baseId);
};

export const initializeClientToken = async () => {
  try {
    const token = await getStoredToken();
    if (token) {
      updateClientToken(token);
    }

    // Initialize workspace and base from navigation store if available
    try {
      const { useNavigationStore } = await import('../stores/navigationStore');
      const navState = useNavigationStore.getState();
      if (navState.selectedWorkspaceId || navState.selectedBaseId) {
        updateClientWorkspaceAndBase(navState.selectedWorkspaceId, navState.selectedBaseId);
      }
    } catch (navError) {
      // Navigation store might not be available, that's okay
      console.warn('[initializeClientToken] Could not access navigation store:', navError);
    }
  } catch (error) {
    console.warn('Failed to initialize client token:', error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getStoredToken();
  const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
  return !!(token && userId);
};

export async function getTenantUsersService() {
  return await makeAuthenticatedCall(() => client.userService.listUsers());
}

export async function getUsersForAssignService() {
  return await makeAuthenticatedCall(() => client.userService.listUsersForAssign());
}

export async function getTenantService() {
  return await makeAuthenticatedCall(() => client.tenantService.getTenant());
}

export async function updateTenantService(updateData: { name: string }) {
  return await makeAuthenticatedCall(() => client.tenantService.updateTenant(updateData));
}

export async function addTenantUserService(userData: {
  firstname: string;
  lastname: string;
  email: string;
  profile_pic?: File;
  is_coowner?: boolean;
  membership?: Array<{
    workspace_id: string;
    role: string;
    bases?: Array<{
      base_id: string;
      role: string;
    }>;
  }>;
}) {
  return await makeAuthenticatedCall(() => client.userService.addUser(userData));
}

export async function removeTenantUserService(userId: string) {
  return await makeAuthenticatedCall(() => client.tenantService.removeUser({ user_id: userId }));
}

export async function deactivateTenantUserService(userId: string) {
  return await makeAuthenticatedCall(() => client.tenantService.deactivateUser({ user_id: userId }));
}

export async function activateTenantUserService(userId: string) {
  return await makeAuthenticatedCall(() => client.tenantService.activateUser({ user_id: userId }));
}

export async function getOrganizationService() {
  return await makeAuthenticatedCall(() => client.organization.getAll()); 
}

export async function updateOrganizationService(orgId: string, updateData: { name: string, description: string }) {
  return await makeAuthenticatedCall(() => client.organization.update(orgId, updateData));
}

export async function getOrganizationServiceById(orgId: string) {
  return await makeAuthenticatedCall(() => client.organization.getById(orgId)); 
}