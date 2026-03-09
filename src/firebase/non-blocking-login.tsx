'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** 
 * Initiate anonymous sign-in. 
 * Returns the promise so the caller can handle errors, but success 
 * is typically handled by the global onAuthStateChanged listener.
 */
export function initiateAnonymousSignIn(authInstance: Auth) {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await'.
  return signInAnonymously(authInstance);
}

/** 
 * Initiate email/password sign-up.
 * Returns the promise so the caller can handle errors (e.g. email-already-in-use).
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await'.
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** 
 * Initiate email/password sign-in.
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await'.
  return signInWithEmailAndPassword(authInstance, email, password);
}
