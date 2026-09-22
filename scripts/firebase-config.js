// scripts/firebase-config.js
//
// 1. Go to https://console.firebase.google.com -> create a project (free tier is fine).
// 2. Project settings -> General -> "Your apps" -> Web app (</>) -> register app.
// 3. Copy the config object Firebase gives you and paste the values below.
// 4. In the Firebase console: Authentication -> Sign-in method -> enable "Email/Password".
// 5. In the Firebase console: Firestore Database -> Create database (start in production mode),
//    then paste the rules from scripts/firestore.rules into Firestore -> Rules.
//
// IMPORTANT: every firebasejs import across this project (here and in auth.js)
// must use the SAME version number. Mixing versions breaks app registration.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCNvHU4ATLlKFh_B9-PDtHZuamUJsacZxw",
  authDomain: "gbcs-mid14.firebaseapp.com",
  projectId: "gbcs-mid14",
  storageBucket: "gbcs-mid14.firebasestorage.app",
  messagingSenderId: "952709701398",
  appId: "1:952709701398:web:297e321e1581a06d00ba37",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);