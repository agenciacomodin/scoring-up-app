// src/components/AdminRoute.js
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext.js'; // Usamos el contexto para saber el rol

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth(); // Obtenemos el usuario con su ROL del contexto
    const router = useRouter();

    // Si todavía estamos verificando quién es el usuario, mostramos un mensaje de carga.
    if (loading) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <p>Verificando acceso...</p>
            </div>
        );
    }

    // Si ya terminó de cargar y (no hay usuario O el rol NO es 'admin')...
    if (!user || user.rol !== 'admin') {
        // ... lo redirigimos a su perfil normal y no mostramos nada.
        router.push('/perfil');
        return null;
    }
    
    // Si todo está bien y es un admin, le permitimos ver el contenido (el dashboard).
    return children;
}