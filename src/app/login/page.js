// RUTA: src/app/login/page.js
"use client";
import { useState } from "react";
import { auth, db } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().rol === 'empresa') {
                router.push("/dashboard-empresa"); // <-- ¡¡CORRECCIÓN APLICADA AQUÍ!!
            } else if (userDocSnap.exists() && userDocSnap.data().rol === 'admin') {
                router.push("/admin"); 
            } else {
                router.push("/perfil");
            }

        } catch (error) {
            console.error("Error al iniciar sesión:", error); 
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') { 
                alert("Email o contraseña incorrectos."); 
            } else { 
                alert("Hubo un problema al iniciar sesión. Inténtalo de nuevo.");
            }
        }
    };
    
    return ( 
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-white">Iniciar Sesión</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="password">Contraseña</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/>
                    </div>
                    <button type="submit" className="w-full py-3 font-bold text-white bg-green-600 rounded-md">Entrar</button>
                </form>
                <p className="text-sm text-center text-gray-400">¿No tienes cuenta?{' '}<a href="/registro" className="font-medium text-green-400 hover:underline">Regístrate</a></p>
            </div>
        </div> 
    );
}