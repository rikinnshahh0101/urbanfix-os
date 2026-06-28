import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJFXIWnc7SmbE4izlIXJwfLbryH3Jbovw",
  authDomain: "liquid-sequencer-6k91c.firebaseapp.com",
  projectId: "liquid-sequencer-6k91c",
  storageBucket: "liquid-sequencer-6k91c.firebasestorage.app",
  messagingSenderId: "716976196260",
  appId: "1:716976196260:web:1ace705cd41edc0006f431"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the exact Database ID provided in config
const db = initializeFirestore(app, {}, "ai-studio-a9b77b4b-d57f-4d09-83c4-8bad4df7b82c");

// Initialize Authentication & Storage
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Standard Connection Verification (highly recommended by Firebase skill)
async function verifyFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your network environment. Firebase is currently offline.");
    } else {
      console.log("Firebase initialized and connection checked.");
    }
  }
}

verifyFirebaseConnection();

export { app, db, auth, storage, googleProvider };
