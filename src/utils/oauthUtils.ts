import { decodeJwt } from 'jose';
import { updateClientToken, updateClientSchema, validateAuthData } from '../service/clientService';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  refresh_expires_at?: number;
}

interface OAuthResponse {
  token: {
    access_token: string;
    refresh_token?: string;
  };
  user: any;
  tenant?: any;
}

/**
 * Obfuscate token for storage (simple obfuscation, not encryption)
 */
const obfuscate = (data: string): string => {
  return btoa(data).split('').reverse().join('');
};

/**
 * Store tokens securely in sessionStorage
 */
const storeTokenSecurely = (tokenData: TokenData): void => {
  try {
    sessionStorage.setItem('_st_', obfuscate(tokenData.access_token));
    if (tokenData.refresh_token) {
      sessionStorage.setItem('_rt_', obfuscate(tokenData.refresh_token));
    }
    if (tokenData.expires_at) {
      sessionStorage.setItem('_te_', tokenData.expires_at.toString());
    }
    if (tokenData.refresh_expires_at) {
      sessionStorage.setItem('_rte_', tokenData.refresh_expires_at.toString());
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Store minimal user information in sessionStorage only (for instant UI render)
 * Full profile will be fetched via useUserProfile hook
 */
const storeUserInfo = (user: any): void => {
  if (!user?.id) return;

  // Store only minimal data in sessionStorage
  const sessionData: Record<string, string> = {
    'user_id': user.id,
  };

  if (user.email) sessionData['user_email'] = user.email;
  if (user.display_name) sessionData['user_display_name'] = user.display_name;
  if (user.avatar) sessionData['user_avatar'] = user.avatar;
  if (user.timezone) sessionData['timezone'] = user.timezone;
  if (user.country) sessionData['country'] = user.country;

  // Batch write to sessionStorage only
  Object.entries(sessionData).forEach(([key, value]) => {
    sessionStorage.setItem(key, value);
  });
};

/**
 * Store tenant schema in sessionStorage and localStorage (as fallback)
 * Only store schema, not tenant_id or tenant_name (not used)
 */
const storeTenantInfo = (tenant: any, accessDecoded?: any): void => {
  // Extract tenant_schema from decoded access token (preferred) or fallback to tenant object
  const schemaName = String(accessDecoded?.tenant_id || 
    accessDecoded?.tenant_schema || 
    accessDecoded?.schema || 
    accessDecoded?.schema_name || 
    accessDecoded?.tenantSchema ||
    tenant?.schema_name || 
    tenant?.schema || 
    tenant?.schemaName || 
    '').trim();

  if (schemaName) {
    sessionStorage.setItem('tenant_schema', schemaName);
    // Keep in localStorage as fallback only
    localStorage.setItem('tenant_schema', schemaName);
    // Update client schema if available
    updateClientSchema(schemaName);
  }
};

/**
 * Process OAuth response data and store all authentication information
 * This is the central function used by both popup and normal OAuth flows
 */
export const processOAuthResponse = async (response: OAuthResponse): Promise<{
  userWithTenant: any;
  tokenData: TokenData;
}> => {
  const { token, user, tenant } = response;

  // Validate required data
  if (!token?.access_token) {
    throw new Error('No authentication token received from server');
  }

  if (!user?.id) {
    throw new Error('User information not received from server');
  }

  // Decode tokens to get expiry times
  const accessDecoded = decodeJwt(token.access_token);
  const refreshDecoded = token.refresh_token ? decodeJwt(token.refresh_token) : null;

  const tokenData: TokenData = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || '',
    expires_at: accessDecoded?.exp as number,
    refresh_expires_at: refreshDecoded?.exp as number
  };

  // Store all authentication data (batched operations)
  storeTokenSecurely(tokenData);
  updateClientToken(token.access_token);
  storeUserInfo(user);
  storeTenantInfo(tenant, accessDecoded);

  // Store roles from decoded token (needed for RBAC)
  if (accessDecoded?.roles) {
    const roles = Array.isArray(accessDecoded.roles) 
      ? accessDecoded.roles 
      : [accessDecoded.roles];
    sessionStorage.setItem('user_roles', JSON.stringify(roles));
  }

  // Validate that all required auth data is present
  const validation = validateAuthData();
  if (!validation.isValid) {
    throw new Error(`Missing required auth data: ${validation.missing.join(', ')}`);
  }

  // Prepare user object with tenant for auth context
  const userWithTenant = {
    ...user,
    tenant: tenant || null
  };

  return { userWithTenant, tokenData };
};

/**
 * Clear OAuth-related sessionStorage items
 */
export const clearOAuthSession = (): void => {
  const oauthKeys = ['oauth_provider', 'oauth_redirect_url', 'oauth_use_popup'];
  oauthKeys.forEach(key => sessionStorage.removeItem(key));
};

/**
 * Check if current window is a popup
 */
export const isPopupWindow = (): boolean => {
  return !!(window.opener && window.opener !== window);
};

/**
 * Send message to parent window (for popup mode)
 */
export const sendMessageToParent = (type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR', data?: any, error?: string): void => {
  if (!isPopupWindow() || !window.opener) {
    return;
  }

  try {
    const message = type === 'OAUTH_SUCCESS'
      ? { type, data }
      : { type, error: error || 'OAuth authentication failed' };

    window.opener.postMessage(message, window.location.origin);
  } catch (err) {
    throw err;
  }
};

/**
 * Close popup window safely
 * Uses requestAnimationFrame for immediate close after message is sent
 */
export const closePopup = (delay: number = 0): void => {
  if (!isPopupWindow()) return;

  const closeWindow = () => {
    try {
      window.close();
    } catch (err) {
      // Popup may already be closed or blocked
    }
  };

  if (delay > 0) {
    setTimeout(closeWindow, delay);
  } else {
    // Use requestAnimationFrame for immediate close (ensures message is processed)
    requestAnimationFrame(closeWindow);
  }
};

