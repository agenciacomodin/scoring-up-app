// RUTA: src/app/admin/page.js
"use client";

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy, where, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '../firebase.js';
import AdminRoute from '../../components/AdminRoute.js';
import { OpenAI } from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
const PROMPT_MAGICO = `(TU PROMPT MÁGICO AQUÍ, CON LA INSTRUCCIÓN JSON)`;

// --- Componente de Métrica (sin cambios) ---
const MetricCard = ({ title, value, color = 'text-green-400' }) => ( <div className="bg-gray-800 p-4 rounded-lg text-center"><p className={`text-3xl font-bold ${color}`}>{value}</p><p className="text-sm text-gray-400">{title}</p></div> );


// --- COMPONENTE DE ACCIONES, AHORA RESTAURADO Y MEJORADO ---
const AccionesAdmin = ({ solicitud }) => {
    
    // -- LÓGICA PARA CLIENTES B2C (Informes Individuales) --
    if (solicitud.tipo !== 'pack_b2b') {
        const [file, setFile] = useState(null);
        const [isProcessing, setIsProcessing] = useState(false);
        const [statusMessage, setStatusMessage] = useState(solicitud.estado);

        const handleB2CProcess = async () => {
            if (!file) { alert("Selecciona un PDF."); return; }
            setIsProcessing(true);
            const solicitudRef = doc(db, 'solicitudes', solicitud.id);
            try {
                setStatusMessage("Subiendo...");
                const storageRef = ref(storage, `informes-pendientes/${solicitud.id}.pdf`);
                await uploadBytes(storageRef, file);
                
                setStatusMessage("Leyendo PDF...");
                const fileReader = new FileReader();
                fileReader.readAsArrayBuffer(file);
                fileReader.onload = async (event) => {
                    try {
                        const pdfData = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                        let textoDelPDF = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            textoDelPDF += (await page.getTextContent()).items.map(item => item.str).join(' ');
                        }

                        setStatusMessage("Analizando...");
                        const promptFinal = PROMPT_MAGICO.replace("{textoDelPDF}", textoDelPDF.replace(/"/g, "'").slice(0, 12000));
                        const response = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: promptFinal }], response_format: { type: "json_object" }, });
                        const analisisJSON = JSON.parse(response.choices[0].message.content);
                        const downloadURL = await getDownloadURL(storageRef);

                        await updateDoc(solicitudRef, { analisisIA: analisisJSON, estado: 'informe_enviado', informeUrl: downloadURL });
                        alert("¡Análisis completado!");
                    } catch (innerError) {
                        await updateDoc(solicitudRef, { estado: "Error Análisis" });
                        alert("Error en análisis: " + innerError.message);
                    } finally { setIsProcessing(false); }
                };
            } catch (uploadError) {
                await updateDoc(solicitudRef, { estado: "Error Subida" });
                alert("Error al subir archivo.");
                setIsProcessing(false);
            }
        };

        return (
            <div className="flex items-center gap-2">
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-xs w-full ..."/>
                <button onClick={handleB2CProcess} disabled={isProcessing} className="bg-purple-600 ...">
                    {isProcessing ? statusMessage : 'Analizar'}
                </button>
            </div>
        );
    }
    
    // -- LÓGICA PARA CLIENTES B2B (Packs) --
    if(solicitud.tipo === 'pack_b2b') {
        const [acreditando, setAcreditando] = useState(false);
        const handleAcreditar = async () => { /* La lógica de acreditar no cambia */
             setAcreditando(true);
            try {
                await runTransaction(db, async (transaction) => {
                    const userRef = doc(db, "users", solicitud.userId);
                    const userDoc = await transaction.get(userRef);
                    if (!userDoc.exists()) throw "Usuario no encontrado.";
                    const creditosActuales = userDoc.data().creditosDisponibles || 0;
                    transaction.update(userRef, { creditosDisponibles: creditosActuales + solicitud.packInformes });
                    transaction.update(doc(db, "solicitudes", solicitud.id), { estado: "pack_acreditado" });
                });
                alert(`Créditos acreditados a ${solicitud.email}`);
            } catch (error) { alert("Error al acreditar: " + error); }
            setAcreditando(false);
        };
        if (solicitud.estado === 'pack_acreditado') return <span className="text-xs text-green-400">Acreditado ✓</span>;
        if (solicitud.estado === 'pendiente_pago') return <span className="text-xs text-yellow-400">Esperando Pago...</span>;
        return <button onClick={handleAcreditar} disabled={acreditando} className="bg-blue-600 ...">{acreditando ? 'Acreditando...' : 'Acreditar Pack'}</button>;
    }

    return <div>Acción no definida</div>;
};


// --- El resto del Dashboard se mantiene igual ---
const DashboardContent = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [activeTab, setActiveTab] = useState('individuales');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const solicitudesFiltradas = useMemo(() => {
        return solicitudes.filter(s => {
            const esIndividual = activeTab === 'individuales' && s.tipo !== 'pack_b2b';
            const esPack = activeTab === 'packs' && s.tipo === 'pack_b2b';
            return esIndividual || esPack;
        });
    }, [solicitudes, activeTab]);

    useEffect(() => { /* ... La lógica de filtrado de fechas no cambia ... */ 
        let constraints = [];
        if (fechaDesde) constraints.push(where("fecha", ">=", new Date(fechaDesde)));
        if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setDate(hasta.getDate() + 1);
            constraints.push(where("fecha", "<", hasta));
        }
        const q = query(collection(db, "solicitudes"), ...constraints, orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snapshot) => { setSolicitudes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
        return () => unsub();
    }, [fechaDesde, fechaHasta]);

    const stats = useMemo(() => { /* La lógica de stats no cambia */
        const informesPagados = solicitudes.filter(s => s.estado === 'informe_enviado' || s.estado === 'pack_acreditado');
        const individuales = informesPagados.filter(s => s.tipo !== 'pack_b2b'); const packs = informesPagados.filter(s => s.tipo === 'pack_b2b');
        return { ventasIndividuales: individuales.length, facturacionIndividual: individuales.reduce((acc, curr) => acc + (curr.precio || 0), 0), ventasPacks: packs.length, facturacionPacks: packs.reduce((acc, curr) => acc + (curr.precio || 0), 0) } 
    }, [solicitudes]);
    
    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard de Gestión</h1>
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-800 rounded-lg"><input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} /> <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} /></div>
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"><MetricCard title="Ventas Indiv." value={stats.ventasIndividuales} /><MetricCard title="Facturación Indiv." value={`$${stats.facturacionIndividual.toLocaleString('es-AR')}`} /><MetricCard title="Ventas Packs" value={stats.ventasPacks} color="text-blue-400"/><MetricCard title="Facturación B2B" value={`$${stats.facturacionPacks.toLocaleString('es-AR')}`} color="text-blue-400"/></div>

            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('individuales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'individuales' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>Informes Individuales</button>
                    <button onClick={() => setActiveTab('packs')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'packs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>Packs B2B</button>
                </nav>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-4 py-3">Fecha</th>
                            <th scope="col" className="px-4 py-3">{activeTab === 'individuales' ? 'Cliente' : 'Empresa'}</th>
                            <th scope="col" className="px-4 py-3">{activeTab === 'individuales' ? 'Estado' : 'Pack'}</th>
                            <th scope="col" className="px-4 py-3">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitudesFiltradas.map(s => (
                            <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-gray-400">{s.fecha?.toDate().toLocaleDateString('es-AR')}</td>
                                <td className="px-4 py-3 font-medium">{s.email}</td>
                                <td className="px-4 py-3">
                                    {activeTab === 'individuales' ? (<span className="px-2 py-1 font-mono text-xs rounded-full bg-gray-600">{s.estado}</span>) : (<span>{s.packNombre}</span>)}
                                </td>
                                <td className="px-4 py-3"><AccionesAdmin solicitud={s} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function AdminPage() { return (<AdminRoute><DashboardContent /></AdminRoute>) };