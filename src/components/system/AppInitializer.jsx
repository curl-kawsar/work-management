"use client";
import { useEffect, useState } from 'react';

/**
 * App Initializer Component
 * Handles application startup tasks via API calls
 * Should be placed in the root layout
 */
export default function AppInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleAppInitialization = async () => {
      try {
        console.log('🔧 Initializing application services...');
        
        // Initialize via API call to avoid server-side imports in client
        const response = await fetch('/api/system/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Application services initialized:', result.message);
        } else {
          console.warn('⚠️ Application initialization API failed, but continuing...');
        }
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        // Still set as initialized to prevent infinite retries
        setIsInitialized(true);
      }
    };

    // Only run on client side and avoid multiple calls
    if (typeof window !== 'undefined' && !isInitialized) {
      handleAppInitialization();
    }
  }, [isInitialized]);

  // This component doesn't render anything visible
  return null;
}