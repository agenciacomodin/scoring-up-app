// src/app/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- ¡NUEVO! Importamos la función de Storage

const firebaseConfig = {
  apiKey: "AIzaSyDpcmSqzZ4B3NcC8OPxr-ZW_AWwE07vTA0",
  authDomain: "scoring-up.firebaseapp.com",
  projectId: "scoring-up",
  storageBucket: "scoring-up.firebasestorage.app", // Esta línea es la dirección de tu Storage
  messagingSenderId: "401357201777",
  appId: "1:401357201777:web:84fe3071472d1fc727d6d0",
};

// Si no hay ninguna app de Firebase inicializada, la crea. Si no, usa la que ya existe.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // <-- ¡NUEVO! Creamos la referencia al servicio de Storage

// Exportamos los tres servicios para que toda la app pueda usarlos
export { auth, db, storage }; // <-- ¡NUEVO! Añadimos 'storage' a la exportación