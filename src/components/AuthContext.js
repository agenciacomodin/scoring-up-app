// src/components/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore'; // Importamos funciones para leer de Firestore
import { auth, db } from "../app/firebase.js"; // Importamos auth y la base de datos (db)

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Renombramos currentUser a 'user' para mayor claridad. Este objeto contendrá TODOS los datos.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase "escucha" si alguien inicia o cierra sesión...
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                // Si hay un usuario logueado en Firebase Auth...
                // ...vamos a la base de datos Firestore a buscar su documento
                const userDocRef = doc(db, "users", authUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Si el documento existe, combinamos los datos de Auth y de Firestore
                    // Ahora el objeto 'user' tiene uid, email, Y TAMBIÉN el rol, plan, etc.
                    setUser({ ...authUser, ...userDocSnap.data() });
                } else {
                    // Si por alguna razón el usuario está en Auth pero no en Firestore,
                    // le asignamos el rol 'user' por defecto por seguridad.
                    setUser({ ...authUser, rol: 'user' });
                }
            } else {
                // Si no hay usuario logueado, el estado es nulo.
                setUser(null);
            }
            setLoading(false);
        });
        
        // Limpiamos el "oyente" para evitar problemas de rendimiento
        return () => unsubscribe();
    }, []); // El array vacío [] asegura que esto se ejecute solo una vez, cuando la app carga.

    // Compartimos el objeto 'user' completo y el estado 'loading' con toda la app.
    const value = {
        user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};