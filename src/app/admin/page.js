// src/app/admin/page.js
"use client";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';           // Ruta a la configuración de la DB
import AdminRoute from '../../components/AdminRoute.js'; // Ruta a nuestro componente de seguridad

// Este es el componente visual del Dashboard
function DashboardContent() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Creamos una consulta a la colección "solicitudes", ordenadas por fecha descendente
        const q = query(collection(db, "solicitudes"), orderBy("fecha", "desc"));

        // onSnapshot "escucha" en tiempo real cualquier cambio en la base de datos
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const listaSolicitudes = [];
            querySnapshot.forEach((doc) => {
                listaSolicitudes.push({ id: doc.id, ...doc.data() });
            });
            setSolicitudes(listaSolicitudes);
            setLoading(false);
        });
        // Nos "desuscribimos" cuando el componente se desmonta para no gastar recursos
        return () => unsubscribe();
    }, []);

    const cambiarEstado = async (id, nuevoEstado) => {
        const solicitudRef = doc(db, 'solicitudes', id);
        try {
            await updateDoc(solicitudRef, { estado: nuevoEstado });
        } catch (error) {
            console.error("Error al actualizar estado: ", error);
            alert("No se pudo cambiar el estado.");
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard de Gestión</h1>
            <a href="/perfil" className="text-green-400 hover:underline mb-6 block">← Volver a mi perfil normal</a>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Solicitudes de Clientes en Tiempo Real</h2>
                {loading ? <p>Cargando solicitudes...</p> :
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Fecha Solicitud</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">DNI</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.map(s => (
                                    <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4">{s.fecha ? new Date(s.fecha.seconds * 1000).toLocaleString('es-AR') : 'N/A'}</td>
                                        <td className="px-6 py-4 font-medium">{s.email}</td>
                                        <td className="px-6 py-4">{s.dni}</td>
                                        <td className="px-6 py-4"><span className="font-bold">{s.estado}</span></td>
                                        <td className="px-6 py-4">
                                            <select 
                                                onChange={(e) => cambiarEstado(s.id, e.target.value)} 
                                                value={s.estado || ''}
                                                className="bg-gray-600 rounded-md p-2 border border-gray-500 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="pendiente_pago">Pendiente Pago</option>
                                                <option value="pago_confirmado">Procesar</option>
                                                <option value="informe_enviado">Completado</option>
                                                <option value="cancelado">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                }
                 {solicitudes.length === 0 && !loading && <p className="text-center py-4 text-gray-500">No hay solicitudes para mostrar.</p>}
            </div>
        </div>
    );
}

// El componente que exportamos por defecto, que envuelve nuestro dashboard con la seguridad
export default function AdminPage() {
  return (
    <AdminRoute>
      <DashboardContent />
    </AdminRoute>
  )
}