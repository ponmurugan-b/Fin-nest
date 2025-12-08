// Cache Manager - Handles app data recovery and cache clearing

const APP_VERSION = '1.0.0';
const VERSION_KEY = 'finnest_version';
const SESSION_KEY = 'finnest_user';

export interface CacheStatus {
  hasSession: boolean;
  isVersionMismatch: boolean;
  sessionData: any;
}

// Check current cache status
export const getCacheStatus = (): CacheStatus => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const sessionData = localStorage.getItem(SESSION_KEY);
  
  return {
    hasSession: !!sessionData,
    isVersionMismatch: storedVersion !== APP_VERSION,
    sessionData: sessionData ? JSON.parse(sessionData) : null
  };
};

// Clear all app data from localStorage
export const clearAllAppData = (): void => {
  const keysToRemove = [
    SESSION_KEY,
    VERSION_KEY,
    'finnest_wallets',
    'finnest_transactions',
    'finnest_savings',
    'finnest_cache'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also clear any other finnest-related keys
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('finnest_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('[CacheManager] All app data cleared');
};

// Set current version after successful load
export const setAppVersion = (): void => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

// Validate session - check if user exists in database
export const validateSession = async (userId: string, dbService: any): Promise<boolean> => {
  try {
    const user = await dbService.getUserById(userId);
    return !!user;
  } catch (error) {
    console.error('[CacheManager] Session validation failed:', error);
    return false;
  }
};

// Initialize cache manager - call on app start
export const initializeCacheManager = async (dbService: any): Promise<{ valid: boolean; userId?: string }> => {
  const status = getCacheStatus();
  
  // If version mismatch, clear cache
  if (status.isVersionMismatch && status.hasSession) {
    console.log('[CacheManager] Version mismatch detected, clearing cache');
    clearAllAppData();
    setAppVersion();
    return { valid: false };
  }
  
  // If no session, just set version
  if (!status.hasSession) {
    setAppVersion();
    return { valid: false };
  }
  
  // Validate existing session
  try {
    const isValid = await validateSession(status.sessionData.id, dbService);
    if (!isValid) {
      console.log('[CacheManager] Invalid session detected, clearing cache');
      clearAllAppData();
      setAppVersion();
      return { valid: false };
    }
    
    setAppVersion();
    return { valid: true, userId: status.sessionData.id };
  } catch (error) {
    console.error('[CacheManager] Error validating session:', error);
    clearAllAppData();
    setAppVersion();
    return { valid: false };
  }
};

// Get current app version
export const getAppVersion = (): string => APP_VERSION;
