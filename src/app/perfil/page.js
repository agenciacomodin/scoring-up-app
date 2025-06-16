"use client";

import { useEffect, useState, useMemo } from 'react';
// ... (imports) ...
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase.js"; 
import { doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- COMPONENTES (versiones resumidas, ya que no cambian) ---
const MiCuenta = ({ user }) => ( <div><h2>Mis Datos</h2><p>Email: {user.email}</p></div> );
const SolicitarInforme = ({ user }) => ( <div><h2>Solicitar Informe</h2>{/* ...el formulario... */}</div> );
const MisInformes = ({ user }) => ( <div><h2>Historial</h2>{/* ...el historial... */}</div> );
const Billetera = ({ user }) => ( <div><h2>Billetera</h2>{/* ...la billetera... */}</div> );
const Educacion = () => ( <div><h2>Educación</h2>{/* ...las lecciones... */}</div> );


// --- Componente Principal ---
export default function PerfilPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('billetera');
    // --- ¡NUEVO ESTADO PARA EL MENÚ MÓVIL! ---
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const router = useRouter();
    
    useEffect(() => { 
        const unsub = onAuthStateChanged(auth, u => {
            if(u) setCurrentUser(u); 
            else router.push('/login'); 
            setLoading(false)
        }); 
        return unsub;
    }, [router]);

    const handleLogout = async () => { await signOut(auth); router.push('/login'); };

    // Función para cambiar de pestaña y cerrar el menú móvil
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false); // Cierra el menú al seleccionar una opción
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900"><p>Cargando...</p></div>;
    
    if (currentUser) {
        // Componente interno para el Menú para no repetir código
        const MenuNav = () => (
            <nav className="flex flex-col space-y-2 p-4">
                <button onClick={() => handleTabChange('billetera')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'billetera' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Billetera</button>
                <button onClick={() => handleTabChange('educacion')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'educacion' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Educación</button>
                <button onClick={() => handleTabChange('informes')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'informes' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mis Informes</button>
                <button onClick={() => handleTabChange('solicitar')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'solicitar' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Solicitar</button>
                <button onClick={() => handleTabChange('cuenta')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'cuenta' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Cuenta</button>
            </nav>
        );

        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
                    <h1 className="text-xl font-bold text-green-400">SCORING UP</h1>
                    {/* Botón de Logout */}
                    <button onClick={handleLogout} className="hidden md:block bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm font-semibold">Cerrar Sesión</button>
                    {/* Botón de Hamburguesa - SOLO SE VE EN MÓVIL (md:hidden) */}
                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </header>
                
                {/* Menú Móvil - tipo dropdown que aparece y desaparece */}
                {isMenuOpen && (
                    <div className="md:hidden bg-gray-800 border-b border-gray-700">
                        <MenuNav />
                    </div>
                )}


                <div className="flex">
                    {/* Menú Lateral para Escritorio - NO SE VE EN MÓVIL (hidden md:block) */}
                    <aside className="hidden md:block w-64 bg-gray-800 shrink-0">
                        <MenuNav />
                    </aside>

                    {/* Contenido Principal */}
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {activeTab === 'educacion' && <Educacion />}
                        {activeTab === 'billetera' && <Billetera user={currentUser} />}
                        {activeTab === 'informes' && <MisInformes user={currentUser} />}
                        {activeTab === 'solicitar' && <SolicitarInforme user={currentUser} />}
                        {activeTab === 'cuenta' && <MiCuenta user={currentUser} />}
                    </main>
                </div>
            </div>
        );
    }
}