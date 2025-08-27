import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  // For local development, you would typically use a service account key
  // For production (like Vercel), you'd use environment variables
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'chartz-706ac',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID || 'chartz-706ac',
    });
  } catch (error) {
    // If credentials are not available, initialize without credentials
    // This will work for development but won't verify tokens
    console.warn('Firebase Admin initialized without credentials:', error);
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'chartz-706ac',
    });
  }
}

export const adminAuth = getAuth();