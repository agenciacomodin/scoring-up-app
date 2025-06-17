"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../firebase.js';
import AdminRoute from '../../components/AdminRoute.js';
import { OpenAI } from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

const PROMPT_MAGICO = `
    Eres 'Asesor Scoring UP', un experto analista de informes crediticios Veraz de Argentina, y trabajas para Libertad Crediticia.
    Tu misión es analizar el informe, detectar los puntos de dolor del usuario y presentar a Libertad Crediticia como la solución experta.
    Debes responder ÚNICAMENTE con un objeto JSON válido. No añadas texto introductorio ni de cierre.
    Analiza el siguiente texto extraído de un informe PDF: "{textoDelPDF}"
    
    El formato de tu respuesta JSON DEBE SER:
    {
      "score": "string",
      "resumenSituacion": "string",
      "alertasCriticas": ["string"],
      "puntosPositivos": "string",
      "necesitaAyuda": boolean,
      "tipoDeudaPrincipal": "string"
    }

    Instrucciones para completar el JSON:
    - score: Busca el número de Score Veraz y descríbelo. Ejemplo: "1 (Muy Alto Riesgo)". Si no está, pon "No especificado".
    - resumenSituacion: Escribe un párrafo de 2-3 líneas resumiendo el estado general y el endeudamiento total.
    - alertasCriticas: Crea un array de strings, donde cada string es un problema grave. Ejemplo: "Deuda con WENANCE S.A. en situación 5 (Irrecuperable).", "Observación de deuda de $37,776.01 con AMX ARGENTINA.".
    - puntosPositivos: Si no tiene deudas y su situación es normal, menciónalo. Si no, escribe "No se detectaron puntos positivos relevantes.".
    - necesitaAyuda: Pon 'true' si el score es menor o igual a 4, o si el array 'alertasCriticas' tiene al menos un ítem. De lo contrario, 'false'.
    - tipoDeudaPrincipal: Clasifica la deuda principal como 'bancaria' (si es de un banco), 'no_bancaria' (servicios, etc), 'prescripta' (si tiene más de 5 años), o 'ninguna'.
    
    ¡IMPORTANTE! Tu respuesta final debe ser estrictamente un objeto JSON.
`;

const FileUploaderAndProcessor = ({ solicitud }) => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Subir y Analizar");

    const getTextFromPdf = async (fileData) => {
        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
        }
        return text;
    };

    const handleProcess = async () => {
        if (!file) { alert("Por favor, selecciona un PDF."); return; }
        setProcessing(true);
        const solicitudRef = doc(db, 'solicitudes', solicitud.id);
        
        try {
            setStatusMessage("1/4: Subiendo PDF...");
            await updateDoc(solicitudRef, { estado: "Subiendo PDF..." });
            const storageRef = ref(storage, `informes-pendientes/${solicitud.id}.pdf`);
            await uploadBytes(storageRef, file);

            setStatusMessage("2/4: Leyendo PDF...");
            await updateDoc(solicitudRef, { estado: "Leyendo PDF..." });
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);

            fileReader.onload = async (event) => {
                try {
                    const pdfData = event.target.result;
                    const textoDelPDF = await getTextFromPdf(pdfData);

                    setStatusMessage("3/4: Analizando con IA...");
                    await updateDoc(solicitudRef, { estado: "Analizando con IA..." });
                    const promptFinal = PROMPT_MAGICO.replace("{textoDelPDF}", textoDelPDF.replace(/"/g, "'").slice(0, 10000));
                    
                    const response = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: promptFinal }],
                        response_format: { type: "json_object" },
                    });

                    setStatusMessage("4/4: Guardando...");
                    const analisisJSON = JSON.parse(response.choices[0].message.content);
                    await updateDoc(solicitudRef, {
                        analisisIA: analisisJSON,
                        estado: 'informe_enviado',
                    });

                    alert("¡Proceso completado con éxito!");

                } catch (innerError) {
                     console.error("Error durante el análisis:", innerError);
                     await updateDoc(solicitudRef, { estado: "Error de Análisis" });
                     alert("Hubo un error en el análisis, revisa la consola.");
                } finally {
                    setProcessing(false);
                    setStatusMessage("Subir y Analizar");
                }
            };
        } catch (uploadError) {
            console.error("Error de subida:", uploadError);
            await updateDoc(solicitudRef, { estado: "Error de Subida" });
            alert("Hubo un error al subir el archivo.");
            setProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-600 file:text-gray-300 hover:file:bg-gray-500" />
            <button onClick={handleProcess} disabled={processing || !file} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md text-xs disabled:bg-gray-500 disabled:cursor-not-allowed">
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
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard de Gestión</h1>
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Solicitudes de Clientes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acción</th></tr></thead>
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
        </div>
    );
}

export default function AdminPage() { return (<AdminRoute><DashboardContent /></AdminRoute>) }