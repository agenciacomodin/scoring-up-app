"use client";
import { useState } from "react";
import { auth, db } from "../firebase.js"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                plan: "free",
                fechaCreacion: new Date(),
            });

            alert("¡Cuenta creada con éxito! Ahora inicia sesión para continuar.");
            router.push("/login");

        } catch (error) {
            console.error("Error al registrar:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("El email ya está registrado. Intenta iniciar sesión.");
            } else if (error.code === 'auth/weak-password') {
                alert("La contraseña debe tener al menos 6 caracteres.");
            } else {
                alert("Error al crear la cuenta: " + error.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Crear Cuenta</h1>
                <p className="text-center text-gray-400 mb-8">Únete a Scoring UP y toma el control.</p>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="tu@email.com" 
                            required 
                            className="w-full px-4 py-2 mt-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres" 
                            required 
                            className="w-full px-4 py-2 mt-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Crear mi cuenta
                    </button>
                </form>

                <p className="text-sm text-center text-gray-400">
                    ¿Ya tienes una cuenta?{' '}
                    <a href="/login" className="font-medium text-green-400 hover:underline">
                        Inicia Sesión aquí
                    </a>
                </p>
            </div>
        </div>
    );
}