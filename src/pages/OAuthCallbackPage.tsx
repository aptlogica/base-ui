import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { client } from '../service/clientService';
import { 
  processOAuthResponse, 
  clearOAuthSession, 
  isPopupWindow, 
  sendMessageToParent, 
  closePopup 
} from '../utils/oauthUtils';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false); // Prevent multiple executions
  
  // Check if we're in a popup - show minimal UI immediately
  const isPopup = typeof window !== 'undefined' && window.opener && window.opener !== window;

  useEffect(() => {
    // Prevent multiple callback executions using both ref and sessionStorage
    const callbackKey = `oauth_callback_processed_${window.location.search}`;
    const alreadyProcessed = sessionStorage.getItem(callbackKey);
    
    if (processedRef.current || alreadyProcessed === 'true') {
      // Already processed - redirect to homepage to avoid staying on callback page
      if (alreadyProcessed === 'true') {
        navigate('/homepage', { replace: true });
      }
      return;
    }

    const handleOAuthCallback = async () => {
      // Mark as processed immediately to prevent re-execution
      processedRef.current = true;
      sessionStorage.setItem(callbackKey, 'true');
      
      try {
        // Get all query parameters from Keycloak callback
        // Keycloak redirects with: ?session_state=...&iss=...&code=...
        const queryString = window.location.search;
        
        // Check for error parameters first (OAuth providers may redirect with error)
        const errorParam = new URLSearchParams(queryString).get('error');
        if (errorParam) {
          const errorDescription = new URLSearchParams(queryString).get('error_description') || errorParam;
          throw new Error(`OAuth authentication failed: ${errorDescription}`);
        }
        
        // If no query params, something is wrong - redirect to login
        if (!queryString || queryString.length < 5) {
          throw new Error('No OAuth callback parameters found. Please try logging in again.');
        }
        
        // Check for required OAuth parameters
        const params = new URLSearchParams(queryString);
        if (!params.has('code') && !params.has('session_state') && !params.has('iss')) {
          throw new Error('Invalid OAuth callback: missing required parameters');
        }
        
        // Use SDK's callback method to avoid CORS issues
        // The SDK handles the HTTP client configuration properly
        const response = await client.auth.callback(queryString);

        if (!response || !response.success || !response.data) {
          const errorMessage = response?.message || response?.error || 'OAuth callback failed';
          throw new Error(errorMessage);
        }

        // Response structure matches normal login: response.data.token, response.data.user, response.data.tenant
        const { token, user, tenant } = response.data;

        if (!token || !token.access_token) {
          throw new Error('No authentication token received from server');
        }

        if (!user || !user.id) {
          throw new Error('User information not received from server');
        }

        // Process OAuth response using shared utility (handles token, user, tenant storage)
        const { userWithTenant } = await processOAuthResponse({ token, user, tenant });

        // Check if we're in a popup window
        const usePopup = sessionStorage.getItem('oauth_use_popup') === 'true';
        const isPopup = isPopupWindow();

        if (isPopup && usePopup) {
          // We're in a popup - send message to parent window and close popup
          try {
            sendMessageToParent('OAUTH_SUCCESS', { token, user, tenant });
            requestAnimationFrame(() => {
              try {
                window.close();
              } catch (e) {
                // Popup may already be closed or blocked
              }
            });
            setLoading(false);
            return;
          } catch (popupError: any) {
            throw new Error('Failed to communicate with parent window');
          }
        } else {
          // Edge case: Direct navigation to callback URL (shouldn't happen in normal flow)
          // Fallback to normal auth flow without popup
          await auth.login(userWithTenant);

          // Small delay to ensure all state updates have propagated
          await new Promise(resolve => setTimeout(resolve, 50));

          // Clear OAuth info
          clearOAuthSession();
          
          // Clear the callback processing marker after a delay
          setTimeout(() => {
            sessionStorage.removeItem(callbackKey);
          }, 5000);

          // Navigate to homepage using React Router
          navigate('/homepage', { replace: true });
        }
      } catch (err: any) {
        setError(err?.message || 'OAuth callback failed');
        
        // Check if we're in a popup
        const usePopup = sessionStorage.getItem('oauth_use_popup') === 'true';
        
        if (isPopupWindow() && usePopup) {
          // Send error message to parent window
          try {
            sendMessageToParent('OAUTH_ERROR', undefined, err?.message || 'OAuth callback failed');
            closePopup(1000);
          } catch (popupError) {
            // Error sending to parent - popup will close anyway
          }
        } else {
          // Clear the processing marker on error so user can retry
          sessionStorage.removeItem(callbackKey);
          processedRef.current = false;
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
    // Only depend on navigate - searchParams changes can trigger re-execution
    // We check queryString inside the handler and use sessionStorage to prevent duplicates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // For popup mode, show minimal loading UI that renders instantly
  if (loading) {
    return (
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '16px',
          textAlign: 'center'
        }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            fontWeight: 500 
          }}>
            {isPopup ? 'Completing sign in...' : 'Completing authentication...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px',
          textAlign: 'center',
          maxWidth: '400px',
          padding: '20px'
        }}>
          <div style={{ 
            fontSize: '16px', 
            color: '#dc2626', 
            fontWeight: 600 
          }}>
            Authentication Failed
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            {error}
          </div>
          {!isPopup && (
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              Redirecting to login...
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallbackPage;