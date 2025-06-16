"use client";

import { useState } from "react";
import { auth } from "../firebase.js"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/perfil");
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert("Email o contraseña incorrectos.");
            } else {
                alert("Hubo un problema al iniciar sesión. Inténtalo de nuevo.");
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Iniciar Sesión</h1>
                <p className="text-center text-gray-400 mb-8">Bienvenido de nuevo a Scoring UP</p>
                
                <form onSubmit={handleLogin} className="space-y-6">
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
                            placeholder="Tu contraseña" 
                            required 
                            className="w-full px-4 py-2 mt-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                        Entrar
                    </button>
                </form>

                <p className="text-sm text-center text-gray-400">
                    ¿No tienes una cuenta?{' '}
                    <a href="/registro" className="font-medium text-green-400 hover:underline">
                        Regístrate aquí
                    </a>
                </p>
            </div>
        </div>
    );
}