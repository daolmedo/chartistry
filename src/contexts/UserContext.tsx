'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, UserProfile } from '@/app/lib/api';

interface UserContextType {
  // Firebase Auth data
  currentUser: User | null;
  authLoading: boolean;

  // User profile data
  userProfile: UserProfile | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  subscriptionTier: string | null;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Loading states
  profileLoading: boolean;
  profileError: string | null;

  // Authentication actions
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Profile actions
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Export useAuth as alias for backward compatibility
export const useAuth = useUser;

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication functions
  const signUp = async (email: string, password: string, name?: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // Create user profile in database
    try {
      await createUserProfile(user.uid, email, name);
    } catch (error) {
      console.error('Failed to create user profile in database:', error);
      // Don't throw error here to prevent signup failure
      // User can still use the app, profile creation can be retried later
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);

    // Check if this is a new user and create profile if needed
    // Google sign-in can be used for both new users and existing users
    if (user.metadata.creationTime === user.metadata.lastSignInTime) {
      // This is likely a new user (creation time equals last sign-in time)
      try {
        await createUserProfile(user.uid, user.email || '', user.displayName || undefined);
      } catch (error) {
        console.error('Failed to create user profile in database:', error);
        // Don't throw error here to prevent signin failure
        // User can still use the app, profile creation can be retried later
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Fetch user profile when Firebase user changes
  const fetchUserProfile = async (userId: string) => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const response = await getUserProfile(userId);
      setUserProfile(response.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to load user profile');
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Refresh user profile function
  const refreshUserProfile = async () => {
    if (currentUser?.uid) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Effect to fetch profile when user logs in/out
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserProfile(currentUser.uid);
    } else {
      // User logged out, clear profile data
      setUserProfile(null);
      setProfileError(null);
    }
  }, [currentUser?.uid]);

  // Derived values for convenience
  const userId = currentUser?.uid || null;
  const email = userProfile?.email || currentUser?.email || null;
  const displayName = userProfile?.display_name || currentUser?.displayName || null;
  const subscriptionTier = userProfile?.subscription_tier || null;

  const value: UserContextType = {
    // Firebase Auth data
    currentUser,
    authLoading,

    // User profile data
    userProfile,
    userId,
    email,
    displayName,
    subscriptionTier,

    // UI state
    sidebarOpen,
    setSidebarOpen,

    // Loading states
    profileLoading,
    profileError,

    // Authentication actions
    signUp,
    signIn,
    signInWithGoogle,
    logout,

    // Profile actions
    refreshUserProfile
  };

  return (
    <UserContext.Provider value={value}>
      {!authLoading && children}
    </UserContext.Provider>
  );
}