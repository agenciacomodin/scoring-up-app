"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../firebase.js';
import AdminRoute from '../../components/AdminRoute.js';

// Componente para subir el archivo. Ahora es más inteligente y actualiza el estado.
const FileUploader = ({ solicitud }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadAndAnalyze = async () => {
        if (!file) {
            alert("Por favor, selecciona un archivo PDF primero.");
            return;
        }
        setUploading(true);
        const solicitudRef = doc(db, 'solicitudes', solicitud.id);

        try {
            // Actualizamos el estado para que el cliente vea que estamos trabajando
            await updateDoc(solicitudRef, { estado: 'procesando_informe' });

            // La ruta en Storage donde guardaremos el PDF
            // El nombre del archivo es el UID del usuario, como lo esperan nuestras reglas.
            const storageRef = ref(storage, `informes-pendientes/${solicitud.id}.pdf`);

            // Subimos el archivo.
            // Al completarse, la Cloud Function se disparará automáticamente en segundo plano.
            await uploadBytes(storageRef, file);
            
            alert(`¡PDF subido para ${solicitud.email}!\nLa IA comenzará el análisis automáticamente.`);

        } catch (error) {
            console.error("Error al subir el archivo: ", error);
            // Si la subida falla, volvemos al estado anterior
            await updateDoc(solicitudRef, { estado: 'pago_confirmado' });
            alert("Hubo un error al subir el PDF. Revisa la consola.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-600 file:text-gray-300 hover:file:bg-gray-500"
            />
            <button 
                onClick={handleUploadAndAnalyze} 
                disabled={uploading || !file}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md text-xs disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {uploading ? 'Procesando...' : 'Subir y Analizar'}
            </button>
        </div>
    );
};


// Componente principal del Dashboard
function DashboardContent() {
    const [solicitudes, setSolicitudes] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "solicitudes"), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setSolicitudes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);
    
    // Función manual para cambiar el estado si es necesario
    const cambiarEstadoManual = async (id, nuevoEstado) => {
        const solicitudRef = doc(db, 'solicitudes', id);
        await updateDoc(solicitudRef, { estado: nuevoEstado });
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard de Gestión</h1>
            <a href="/perfil" className="text-green-400 hover:underline mb-6 block">← Volver a mi Perfil</a>
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Solicitudes de Clientes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">DNI</th>
                                <th className="px-4 py-3">Estado Actual</th>
                                <th className="px-4 py-3">Acción Principal (Subir PDF para IA)</th>
                                <th className="px-4 py-3">Cambio Manual de Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.map(s => (
                                <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-600">
                                    <td className="px-4 py-4 font-medium">{s.email}<br/><span className="text-xs text-gray-400">{s.nombre}</span></td>
                                    <td className="px-4 py-4">{s.dni}</td>
                                    <td className="px-4 py-4 font-mono">{s.estado}</td>
                                    <td className="px-4 py-4">
                                        <FileUploader solicitud={s} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <select onChange={(e) => cambiarEstadoManual(s.id, e.target.value)} value={s.estado || ''} className="bg-gray-600 p-2 rounded-md">
                                            <option value="pendiente_pago">Pendiente Pago</option>
                                            <option value="pago_confirmado">Pago Confirmado</option>
                                            <option value="informe_enviado">Informe Enviado</option>
                                            <option value="cancelado">Cancelado</option>
                                            <option value="Error de Análisis IA">Error IA</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// El componente que exporta y protege la ruta no cambia
export default function AdminPage() { 
    return (<AdminRoute><DashboardContent /></AdminRoute>);
}