// RUTA: src/app/dashboard-empresa/page.js
"use client";
import { useAuth } from '../../components/AuthContext.js';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from '../firebase.js';
import { signOut } from "firebase/auth";
import { useEffect, useState } from 'react';

// Este es un componente protegido, solo para empresas.
export default function DashboardEmpresaPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [informesComprados, setInformesComprados] = useState([]);

    useEffect(() => {
        // Protección de ruta
        if (!loading && (!user || user.rol !== 'empresa')) {
            router.push('/login');
        }

        // Si es una empresa, buscamos sus packs comprados
        if (user) {
            const q = query(
                collection(db, "solicitudes"), 
                where("userId", "==", user.uid),
                where("tipo", "==", "pack_b2b")
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setInformesComprados(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            });
            return () => unsubscribe();
        }
    }, [user, loading, router]);
    
    const creditosDisponibles = user?.creditosDisponibles || 0;
    
    if (loading || !user) {
        return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center"><p>Cargando panel de empresa...</p></div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <header className="bg-gray-800 p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-400">Panel de Empresa: {user.nombreEmpresa}</h1>
                <button onClick={async () => {await signOut(auth); router.push('/')}} className="bg-red-600 p-2 rounded-lg">Cerrar Sesión</button>
            </header>
            <main className="p-8">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Tarjeta de Créditos */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-gray-400 text-sm">Créditos Disponibles</h2>
                        <p className="text-4xl font-bold text-white">{creditosDisponibles}</p>
                        <p className="text-xs text-gray-500">Para solicitar informes Veraz.</p>
                        <button onClick={() => router.push('/empresas')} className="mt-4 w-full text-sm bg-blue-600 p-2 rounded-lg">Comprar más créditos</button>
                    </div>
                    {/* Formulario de Consulta */}
                    <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg">
                        <h2 className="font-bold mb-2">Consultar un DNI</h2>
                         <form className="flex gap-4">
                            <input type="number" placeholder="Ingresar DNI sin puntos" className="flex-grow bg-gray-700 p-2 rounded-lg"/>
                            <button type="submit" disabled={creditosDisponibles <= 0} className="bg-green-600 px-6 p-2 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">Consultar</button>
                        </form>
                        {creditosDisponibles <= 0 && <p className="text-xs text-yellow-400 mt-2">No tienes créditos suficientes para realizar consultas.</p>}
                    </div>
                </div>

                {/* Historial de Compras de Packs */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="font-bold mb-4">Historial de Packs Comprados</h2>
                    <table className="w-full text-left text-sm">
                        <thead><tr><th>Fecha</th><th>Pack</th><th>Precio</th><th>Estado</th></tr></thead>
                        <tbody>
                            {informesComprados.map(pack => (
                                <tr key={pack.id} className="border-b border-gray-700">
                                    <td className="py-2">{pack.fecha.toDate().toLocaleDateString('es-AR')}</td>
                                    <td>{pack.packNombre}</td>
                                    <td>${pack.precio.toLocaleString('es-AR')}</td>
                                    <td><span className="bg-gray-600 px-2 py-1 rounded-full text-xs">{pack.estado}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}