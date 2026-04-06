'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, rtdb, isFirebaseConfigured } from './firebase';
import { useRouter, usePathname } from 'next/navigation';

export type UserRole = 'admin' | 'hospital' | 'patient' | 'driver' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
  isFirebaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  hospital: '/hospital',
  patient: '/patient',
  driver: '/driver',
};

// Demo users seeded from environment
const DEMO_ROLE_MAP: Record<string, UserRole> = {
  'admin@teros.com': 'admin',
  'hospital@aiims.com': 'hospital',
  'patient@teros.com': 'patient',
  'driver@teros.com': 'driver',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Use the pre-computed flag from firebase.ts
    if (!isFirebaseConfigured) {
      console.info('[Auth] No Firebase credentials — running in demo mode.');
      setLoading(false);
      setIsFirebaseReady(false);
      return;
    }

    setIsFirebaseReady(true);

    let unsubscribeAuth = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          // Try fetching role from RTDB first
          const roleRef = ref(rtdb, `users/${currentUser.uid}/role`);
          const unsubscribeRole = onValue(roleRef, (snapshot) => {
            let fetchedRole: UserRole = snapshot.val() as UserRole;

            // Fallback: use email-based demo map if no RTDB role set
            if (!fetchedRole && currentUser.email) {
              fetchedRole = DEMO_ROLE_MAP[currentUser.email] ?? null;
            }

            setRole(fetchedRole);
            setLoading(false);

            // Only redirect if currently on login or root
            if ((pathname === '/login' || pathname === '/') && fetchedRole) {
              router.push(ROLE_ROUTES[fetchedRole] ?? '/');
            }
          });

          return () => unsubscribeRole();
        } else {
          setRole(null);
          setLoading(false);
          // Redirect to login if not on a public page
          const publicPaths = ['/login', '/'];
          if (!publicPaths.includes(pathname)) {
            router.push('/login');
          }
        }
      });
    }

    return () => unsubscribeAuth();
  }, [router, pathname]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, isFirebaseReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
