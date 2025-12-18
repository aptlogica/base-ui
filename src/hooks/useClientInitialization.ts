import { useEffect, useState } from 'react';
import { initializeClientToken, getTenantSchema, isAuthenticated } from '../service/clientService';

export const useClientInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setIsLoading(true);

        // Check if user is authenticated
        const authenticated = await isAuthenticated();
        if (authenticated) {
          // Initialize client with token and schema
          await initializeClientToken();
          setIsInitialized(true);
        } else {
          setIsInitialized(false);
        }
      } catch (error) {
        console.error('Failed to initialize client:', error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, []);

  return {
    isInitialized,
    isLoading,
    tenantSchema: getTenantSchema()
  };
};
