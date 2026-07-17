import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Firebase Applet configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiGX5hG3j1l5MDP5OmxGG94W9qN4U70YA",
  authDomain: "hypnic-stronghold-gj4jh.firebaseapp.com",
  projectId: "hypnic-stronghold-gj4jh",
  storageBucket: "hypnic-stronghold-gj4jh.firebasestorage.app",
  messagingSenderId: "853069017189",
  appId: "1:853069017189:web:dc23655cf9b8f926a6568c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and enable long-polling
// to prevent connection blockages in sandboxed iframe/proxy environments.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  "ai-studio-mathacademy-bbc8b538-0e13-4ccd-8453-52fd2d62a5e4"
);
