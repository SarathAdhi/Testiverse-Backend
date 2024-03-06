import { FirebaseOptions, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { FIREBASE_API_KEY, FIREBASE_APP_ID } from "../utils/my-envs";

const firebaseConfig: FirebaseOptions = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "testiverse-website.firebaseapp.com",
  projectId: "testiverse-website",
  storageBucket: "testiverse-website.appspot.com",
  messagingSenderId: "1000359046680",
  appId: FIREBASE_APP_ID,
  measurementId: "G-J2GXBM1MEN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
