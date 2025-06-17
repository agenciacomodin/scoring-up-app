"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../firebase.js';
import AdminRoute from '../../components/AdminRoute.js';
import { OpenAI } from 'openai';
// IMPORTAMOS LA LIBRERÍA CORRECTA PARA LEER PDFs EN NAVEGADOR
import * as pdfjsLib from 'pdfjs-dist';

// Configuración obligatoria para la librería pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

// Inicializamos OpenAI
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

const PROMPT_MAGICO = `
    Eres 'Asesor Scoring UP', un experto analista de informes crediticios Veraz...
    (Aquí va tu prompt completo)
`;

const FileUploaderAndProcessor = ({ solicitud }) => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Subir y Analizar");

    // Función que extrae texto del PDF usando la librería CORRECTA
    const getTextFromPdf = async (fileData) => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ');
            }
            return text;
        } catch (error) {
            throw new Error("No se pudo leer el archivo PDF.");
        }
    };

    const handleProcess = async () => {
        if (!file) { alert("Selecciona un PDF."); return; }
        setProcessing(true);
        const solicitudRef = doc(db, 'solicitudes', solicitud.id);
        
        try {
            setStatusMessage("Subiendo PDF...");
            await updateDoc(solicitudRef, { estado: "Subiendo PDF..." });
            const storageRef = ref(storage, `informes-pendientes/${solicitud.id}.pdf`);
            await uploadBytes(storageRef, file);

            setStatusMessage("Leyendo PDF...");
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = async (event) => {
                try {
                    const pdfData = new Uint8Array(event.target.result);
                    const textoDelPDF = await getTextFromPdf(pdfData);

                    setStatusMessage("Analizando con IA...");
                    const promptFinal = PROMPT_MAGICO.replace("{textoDelPDF}", textoDelPDF.replace(/"/g, "'").slice(0, 10000));
                    
                    const response = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: promptFinal }],
                        response_format: { type: "json_object" },
                    });

                    setStatusMessage("Guardando análisis...");
                    const analisisJSON = JSON.parse(response.choices[0].message.content);
                    await updateDoc(solicitudRef, {
                        analisisIA: analisisJSON,
                        estado: 'informe_enviado',
                    });

                    alert("¡Análisis completado!");

                } catch (innerError) {
                     await updateDoc(solicitudRef, { estado: "Error de Análisis" });
                     alert("Error en el análisis: " + innerError.message);
                } finally {
                    setProcessing(false);
                    setStatusMessage("Subir y Analizar");
                }
            };
        } catch (uploadError) {
            await updateDoc(solicitudRef, { estado: "Error de Subida" });
            alert("Error al subir archivo.");
            setProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-xs file:... "/>
            <button onClick={handleProcess} disabled={processing || !file} className="bg-purple-600 ...">
                {processing ? statusMessage : 'Subir y Analizar'}
            </button>
        </div>
    );
};


function DashboardContent() {
    const [solicitudes, setSolicitudes] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "solicitudes"), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snapshot) => setSolicitudes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsub();
    }, []);
    return (
        <div className="bg-gray-900 ... p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard de Gestión</h1>
             <div className="bg-gray-800 rounded-lg p-4 ...">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs ..."><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acción</th></tr></thead>
                    <tbody>
                        {solicitudes.map(s => (<tr key={s.id} className="border-b border-gray-700">
                            <td className="px-4 py-4">{s.email}<br/><span className="text-xs text-gray-400">{s.nombre} - DNI: {s.dni}</span></td>
                            <td className="px-4 py-4 font-mono">{s.estado}</td>
                            <td className="px-4 py-4"><FileUploaderAndProcessor solicitud={s} /></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AdminPage() { return (<AdminRoute><DashboardContent /></AdminRoute>) }