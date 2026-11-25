import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken } from '../lib/api';
import type { Language, User, VendorProfile } from '../types';

interface AppContextValue {
  user: User | null;
  vendor: VendorProfile | null;
  language: Language;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setLanguage: (lang: Language) => void;
  setSession: (token: string, user: User, vendor: VendorProfile) => void;
  updateVendorState: (vendor: VendorProfile) => void;
  signOut: () => void;
  loginAsDemo: () => Promise<VendorProfile>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [language, setLanguageState] = useState<Language>('en');
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(Boolean(getAuthToken()));

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    api
      .me()
      .then((res) => {
        setUser(res.user);
        setVendor(res.vendor);
        if (res.vendor.language === 'hi' || res.vendor.language === 'en') {
          setLanguageState(res.vendor.language);
        }
      })
      .catch(() => {
        setAuthToken(null);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  const setSession = useCallback((token: string, nextUser: User, nextVendor: VendorProfile) => {
    setAuthToken(token);
    setUser(nextUser);
    setVendor(nextVendor);
    if (nextVendor.language === 'hi' || nextVendor.language === 'en') {
      setLanguageState(nextVendor.language);
    }
  }, []);

  const updateVendorState = useCallback((nextVendor: VendorProfile) => {
    setVendor(nextVendor);
    if (nextVendor.language === 'hi' || nextVendor.language === 'en') {
      setLanguageState(nextVendor.language);
    }
  }, []);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      if (vendor) {
        api
          .updateSettings({ language: lang })
          .then((res) => setVendor(res.vendor))
          .catch(() => {});
      }
    },
    [vendor]
  );

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setVendor(null);
  }, []);

  const loginAsDemo = useCallback(async () => {
    const res = await api.demoLogin();
    setSession(res.token, res.user, res.vendor);
    return res.vendor;
  }, [setSession]);

  return (
    <AppContext.Provider
      value={{
        user,
        vendor,
        language,
        isAuthenticated: Boolean(user && vendor),
        isBootstrapping,
        setLanguage,
        setSession,
        updateVendorState,
        signOut,
        loginAsDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
