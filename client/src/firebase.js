import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Niche wala code apne Firebase Console se copy karke replace karein
const firebaseConfig = {
  apiKey: "AIzaSyAdVI7KeykAUyjhGBcH_xeNOBDquWgw2Lk",
  authDomain: "sutra-ai-f37c5.firebaseapp.com",
  projectId: "sutra-ai-f37c5",
  storageBucket: "sutra-ai-f37c5.firebasestorage.app",
  messagingSenderId: "339998279985",
  appId: "1:339998279985:web:e10e906daceef0821d4810"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();