// Cache Manager - Handles app data recovery and cache clearing

const APP_VERSION = '1.0.0';
const VERSION_KEY = 'finnest_version';
const SESSION_KEY = 'finnest_user';

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
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
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

// Check if version changed and clear cache if needed (synchronous)
export const checkVersionAndClearIfNeeded = (): boolean => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== APP_VERSION) {
    console.log('[CacheManager] Version mismatch, clearing cache');
    clearAllAppData();
    setAppVersion();
    return true; // Cache was cleared
  }
  return false;
};

// Simple synchronous initialization - no database calls
export const initializeCacheManager = (): { cleared: boolean } => {
  const cleared = checkVersionAndClearIfNeeded();
  return { cleared };
};

// Get stored user (synchronous)
export const getStoredUser = (): any | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
};

// Get current app version
export const getAppVersion = (): string => APP_VERSION;
