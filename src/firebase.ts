import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import config from "../firebase-applet-config.json";

// Detect if the configuration in firebase-applet-config.json contains placeholder values.
// If it does (e.g., during development or initial sandbox runs), fall back to the
// original pre-configured working Firestore database to avoid connection offline errors.
const isPlaceholder = !config.apiKey || config.apiKey.includes("remixed-");

const firebaseConfig = isPlaceholder ? {
  apiKey: "AIzaSyCiGX5hG3j1l5MDP5OmxGG94W9qN4U70YA",
  authDomain: "hypnic-stronghold-gj4jh.firebaseapp.com",
  projectId: "hypnic-stronghold-gj4jh",
  storageBucket: "hypnic-stronghold-gj4jh.firebasestorage.app",
  messagingSenderId: "853069017189",
  appId: "1:853069017189:web:dc23655cf9b8f926a6568c"
} : {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const databaseId = isPlaceholder 
  ? "ai-studio-mathacademy-bbc8b538-0e13-4ccd-8453-52fd2d62a5e4" 
  : (config.firestoreDatabaseId || "remixed-firestore-database-id");

// Initialize Firestore with specific database ID, enable long-polling
// to prevent connection blockages in sandboxed iframe/proxy environments,
// and configure offline persistence supporting multiple tabs.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  databaseId
);


