// src/app/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpcmSqzZ4B3NcC8OPxr-ZW_AWwE07vTA0",
  authDomain: "scoring-up.firebaseapp.com",
  projectId: "scoring-up",
  storageBucket: "scoring-up.firebasestorage.app",
  messagingSenderId: "401357201777",
  appId: "1:401357201777:web:84fe3071472d1fc727d6d0",
};

// Si no hay ninguna app de Firebase inicializada, créala.
// Si ya existe, simplemente usa la que ya está.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos los servicios para que toda la app los pueda usar
export { auth, db };