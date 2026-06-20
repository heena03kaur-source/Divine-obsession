import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDdE-ew2-NxmFJPw-cboWarTWgum67ApAA",
  authDomain: "divine-obsession.firebaseapp.com",
  projectId: "divine-obsession",
  storageBucket: "divine-obsession.firebasestorage.app",
  messagingSenderId: "69934734912",
  appId: "1:69934734912:web:73d804525f262adbde09a5",
  measurementId: "G-XT742QG1LP"
};

export const app = initializeApp(firebaseConfig);
// Only initialize analytics if we are in the browser
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
