// RUTA: src/app/registro/page.js
"use client";
import { useState } from "react";
import { auth, db } from "../firebase.js"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("user"); // <-- Nuevo estado para el rol, por defecto 'user'
    const [nombreEmpresa, setNombreEmpresa] = useState(""); // <-- Nuevo estado para el nombre de la empresa
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Datos base del usuario
            let userData = {
                email: user.email,
                plan: "free",
                rol: rol, // <-- Guardamos el rol seleccionado
                fechaCreacion: new Date(),
            };

            // Si es una empresa, añadimos el nombre de la empresa
            if (rol === 'empresa') {
                userData.nombreEmpresa = nombreEmpresa;
                userData.creditosDisponibles = 0; // Inician con 0 créditos
            }

            await setDoc(doc(db, "users", user.uid), userData);

            alert("¡Cuenta creada con éxito! Ahora inicia sesión.");
            router.push("/login");

        } catch (error) {
            // ... (el manejo de errores es el mismo) ...
            console.error("Error al registrar:", error); if (error.code === 'auth/email-already-in-use') { alert("El email ya está registrado. Intenta iniciar sesión."); } else if (error.code === 'auth/weak-password') { alert("La contraseña debe tener al menos 6 caracteres."); } else { alert("Error al crear la cuenta: " + error.message); }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-white">Crear Cuenta</h1>

                {/* Selector de tipo de cuenta */}
                <div className="flex rounded-md shadow-sm">
                    <button onClick={() => setRol('user')} className={`px-4 py-2 text-sm font-medium w-1/2 ${rol === 'user' ? 'bg-green-600 text-white z-10 ring-2 ring-green-500' : 'bg-gray-700 text-gray-300'} rounded-l-md`}>Para Mí</button>
                    <button onClick={() => setRol('empresa')} className={`-ml-px px-4 py-2 text-sm font-medium w-1/2 ${rol === 'empresa' ? 'bg-blue-600 text-white z-10 ring-2 ring-blue-500' : 'bg-gray-700 text-gray-300'} rounded-r-md`}>Para mi Empresa</button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {rol === 'empresa' && (
                        <div><label htmlFor="nombreEmpresa" className="block text-sm font-medium text-gray-300">Nombre de la Empresa</label><input id="nombreEmpresa" type="text" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/></div>
                    )}
                    <div><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/></div>
                    <div><label htmlFor="password">Contraseña</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/></div>
                    <button type="submit" className="w-full py-3 font-bold text-white bg-green-600 rounded-md">Crear mi cuenta</button>
                </form>
                 <p className="text-sm text-center text-gray-400">¿Ya tienes una cuenta?{' '}<a href="/login" className="font-medium text-green-400 hover:underline">Inicia Sesión</a></p>
            </div>
        </div>
    );
}