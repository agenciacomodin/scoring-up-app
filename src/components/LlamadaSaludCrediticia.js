// src/components/LlamadaSaludCrediticia.js
"use client";
import { useState } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../app/firebase.js"; // Asegúrate que la ruta es correcta

export default function LlamadaSaludCrediticia({ user, solicitud }) {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [mensaje, setMensaje] = useState(`Hola, mi informe (ID: ${solicitud.id}) tiene alertas. Necesito ayuda.`);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const solicitudRef = doc(db, 'solicitudes', user.uid);
        try {
            // Actualizamos la solicitud en Firestore con los datos de contacto
            await updateDoc(solicitudRef, {
                contactoSaludCrediticia: {
                    nombre,
                    telefono,
                    mensaje,
                    fechaContacto: new Date(),
                }
            });
            alert("¡Gracias! Un asesor del área de Salud Crediticia se pondrá en contacto contigo a la brevedad.");
            // Limpiamos el formulario
            setNombre('');
            setTelefono('');
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            alert("Hubo un error al enviar tu solicitud. Por favor, intenta de nuevo.");
        }
    };
    
    // Creamos el mensaje pre-cargado para WhatsApp
    const whatsappMessage = `https://wa.me/5493434649645?text=${encodeURIComponent(`Hola, mi nombre es [TU NOMBRE]. Vengo de Scoring UP. Mi informe (ID de solicitud: ${solicitud.id}) tiene alertas y necesito ayuda del área de Salud Crediticia.`)}`;

    return (
        <div className="bg-red-900 border-2 border-red-700 p-6 rounded-lg mt-6">
            <h3 className="text-2xl font-bold text-white text-center">¡Es Hora de Mejorar tu Salud Crediticia!</h3>
            <p className="text-red-200 mt-2 text-center max-w-2xl mx-auto">Hemos detectado registros negativos en tu informe. Nuestro equipo especializado en **Salud Crediticia** puede ayudarte a entender tus opciones y gestionar la eliminación de deudas prescritas o ya pagadas, para que puedas recuperar tu poder de compra.</p>
            
            <div className="mt-6 grid md:grid-cols-2 gap-6 items-start">
                {/* Opción 1: WhatsApp (Más Directo) */}
                <div className="bg-gray-800 p-6 rounded-lg text-center flex flex-col h-full">
                    <h4 className="text-xl font-bold text-green-400">Atención Directa</h4>
                    <p className="text-gray-300 my-4 flex-grow">Habla ahora mismo con un asesor experto por WhatsApp.</p>
                    <a 
                        href={whatsappMessage}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-auto block w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Contactar por WhatsApp
                    </a>
                </div>

                {/* Opción 2: Formulario (Menos Urgente) */}
                <div className="bg-gray-800 p-6 rounded-lg">
                     <h4 className="text-xl font-bold mb-4 text-center">Solicitar Contacto</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm text-gray-400">Nombre Completo</label>
                            <input type="text" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/>
                        </div>
                        <div>
                            <label htmlFor="telefono" className="block text-sm text-gray-400">Teléfono (WhatsApp)</label>
                            <input type="tel" id="telefono" value={telefono} onChange={e => setTelefono(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                            Que me contacte un asesor
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}