// src/app/admin/page.js
"use client";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../firebase.js';
import AdminRoute from '../../components/AdminRoute.js';

// --- COMPONENTES ---
const FileUploader = ({ solicitudId }) => { 
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const handleFileChange = (e) => { if (e.target.files[0]) { setFile(e.target.files[0]); } };
    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const storageRef = ref(storage, `informes-pendientes/${solicitudId}.pdf`);
        try {
            await uploadBytes(storageRef, file);
            alert(`PDF subido!`);
        } catch (e) {
            alert("Error al subir el PDF.");
        } finally {
            setUploading(false);
        }
    };
    return (
        <div className="flex items-center gap-2">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="text-xs" />
            <button onClick={handleUpload} disabled={uploading || !file} className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-xs disabled:bg-gray-500">{uploading ? '...' : 'Subir'}</button>
        </div>
    );
};

// --- DASHBOARD ---
function DashboardContent() {
    const [solicitudes, setSolicitudes] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "solicitudes"), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snapshot) => setSolicitudes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsub();
    }, []);

    const cambiarEstado = async (id, nuevoEstado) => {
        await updateDoc(doc(db, 'solicitudes', id), { estado: nuevoEstado });
    };

    // Función para simular el análisis de la IA
    const analizarConIA = async (solicitudId, email) => {
        const confirmacion = confirm(`¿Estás seguro de que quieres simular el análisis para ${email}? Esto cambiará el estado a 'informe_enviado'.`);
        if (!confirmacion) return;

        alert("Iniciando simulación de análisis con IA...");
        
        // Texto de ejemplo que la IA generaría
        const resumenSimulado = `
**Resumen de Situación (Análisis Simulado):**
La situación crediticia actual presenta un riesgo moderado. Se observan algunas deudas recientes pero no hay morosidad de alto riesgo.

**Detalles Clave:**
- **Puntaje (Score):** 750 (Estimado)
- **Deudas Activas:** Tarjeta Naranja (saldo bajo), Préstamo personal Banco Macro.

**Recomendaciones:**
1. Mantener los pagos de la tarjeta al día para mejorar el score a corto plazo.
2. Evitar solicitar nuevos créditos en los próximos 3 meses para no afectar el historial.
        `.trim();
        
        try {
            const solicitudRef = doc(db, 'solicitudes', solicitudId);
            await updateDoc(solicitudRef, {
                resumenIA: resumenSimulado,
                estado: 'informe_enviado'
            });
            alert("¡Análisis simulado completado y guardado para el cliente!");
        } catch (error) {
            console.error("Error al simular análisis: ", error);
            alert("Hubo un error al guardar el análisis simulado.");
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard de Gestión Interna</h1>
            <a href="/perfil" className="text-green-400 hover:underline mb-6 block">← Volver a mi Perfil de Admin</a>
            <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Solicitudes de Clientes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">DNI</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">1. Subir PDF</th>
                                <th className="px-4 py-3">2. Analizar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.map(s => (
                                <tr key={s.id} className="border-b border-gray-700">
                                    <td className="px-4 py-4 font-medium">{s.email}<br/><span className="text-xs text-gray-400">{s.nombre}</span></td>
                                    <td className="px-4 py-4">{s.dni}</td>
                                    <td className="px-4 py-4">
                                         <select onChange={(e) => cambiarEstado(s.id, e.target.value)} value={s.estado || ''} className="bg-gray-600 p-2 rounded-md">
                                            <option value="pendiente_pago">Pendiente Pago</option>
                                            <option value="pago_confirmado">Pago Confirmado</option>
                                            <option value="informe_enviado">Informe Enviado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4"><FileUploader solicitudId={s.id} /></td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={() => analizarConIA(s.id, s.email)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md"
                                        >
                                            IA
                                        </button>
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

export default function AdminPage() { return (<AdminRoute><DashboardContent /></AdminRoute>) }