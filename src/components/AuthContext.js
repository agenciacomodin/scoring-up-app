"use client";

import { createContext, useContext, useEffect, useState } from "react";
// Ahora que lo movimos, necesitamos la ruta correcta a firebase.js
import { auth } from "../app/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es la función de Firebase que "escucha" los cambios de sesión
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    // Esto se ejecuta cuando el componente se "desmonta", para evitar fugas de memoria
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
  };

  // Solo mostramos el contenido de la app cuando hemos verificado si hay usuario o no
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};