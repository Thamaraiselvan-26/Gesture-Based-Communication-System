// scripts/auth.js
// Shared sign-up / log-in / log-out logic for GCS, built on Firebase Auth + Firestore.

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Friendly text for the Firebase error codes users actually hit.
const ERROR_MESSAGES = {
  "auth/email-already-in-use": "That email already has an account. Try logging in instead.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

export function friendlyAuthError(error) {
  return ERROR_MESSAGES[error?.code] || "Something went wrong. Please try again.";
}

/**
 * Create an account, set the display name, and store a profile document in Firestore.
 * preferredMode is one of "blind" | "deaf" | "normal" | "" (unset).
 */
export async function signUp({ name, email, password, preferredMode }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, "users", credential.user.uid), {
    name,
    email,
    preferredMode: preferredMode || null,
    createdAt: serverTimestamp(),
  });
  return credential.user;
}

export async function logIn({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  await signOut(auth);
}

/** Redirects to login.html if nobody is signed in. Call on pages that require auth. */
export function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = redirectTo;
      } else {
        resolve(user);
      }
    });
  });
}

/**
 * Wires up any element with [data-auth-status] to show "Hi, NAME" + a logout button
 * when signed in, or a login/signup link when signed out. Drop this on index.html
 * and the three mode pages to reflect auth state in the nav without changing markup much.
 */
export function watchAuthUI() {
  onAuthStateChanged(auth, (user) => {
    document.querySelectorAll("[data-auth-status]").forEach((el) => {
      if (user) {
        el.innerHTML = `
          <span class="auth-greeting">Hi, ${escapeHtml(user.displayName || user.email)}</span>
          <button type="button" class="auth-logout-btn" data-auth-logout>Log out</button>
        `;
        el.querySelector("[data-auth-logout]")?.addEventListener("click", async () => {
          await logOut();
          window.location.href = "index.html";
        });
      } else {
        el.innerHTML = `
          <a href="login.html" class="auth-nav-link">Log in</a>
          <a href="signup.html" class="auth-nav-link auth-nav-link--accent">Sign up</a>
        `;
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
