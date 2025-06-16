"use client";

import Link from 'next/link';
import { useAuth } from './AuthContext.js';

export default function Header() {
    const { currentUser } = useAuth(); 

    return (
        <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="text-2xl font-bold text-green-400">
                    <Link href="/">Scoring UP</Link>
                </div>
                <div className="hidden md:flex space-x-6 items-center">
                    <Link href="/" className="hover:text-green-400 transition-colors">Home</Link>
                    {/* *** ¡NUEVO ENLACE! *** */}
                    <Link href="/empresas" className="hover:text-green-400 transition-colors">Packs B2B</Link>
                    <a href="#" className="hover:text-green-400 transition-colors">Educación</a>
                    <a href="#" className="hover:text-green-400 transition-colors">Contacto</a>
                </div>
                <div>
                    {currentUser ? (
                        <Link href="/perfil" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                            Ir a mi Panel
                        </Link>
                    ) : (
                        <div className="space-x-4">
                            <Link href="/login" className="hover:text-green-400">Iniciar Sesión</Link>
                            <Link href="/registro" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Registrarse</Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}