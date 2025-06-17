// RUTA: src/app/empresas/page.js
"use client";

import Header from '../../components/Header.js';
import Footer from '../../components/Footer.js';
import { useAuth } from '../../components/AuthContext.js';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase.js"; 

// Array de planes con la información y los links de pago reales.
const planes = [
    { nombre: 'Starter', informes: 10, precio: 17000, precioUnitario: 1700, linkPago: "https://mpago.la/1SL3m1E" },
    { nombre: 'Business', informes: 50, precio: 80000, precioUnitario: 1600, linkPago: "https://mpago.la/1c8b88V", destacado: true },
    { nombre: 'Corporate', informes: 100, precio: 150000, precioUnitario: 1500, linkPago: "https://mpago.la/1wDWzk2" },
    { nombre: 'Enterprise', informes: 300, precio: 420000, precioUnitario: 1400, linkPago: "https://mpago.la/1amTio1" }
];

const PlanCard = ({ plan, onSolicitar }) => (
    <div className={`border-2 ${plan.destacado ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-700'} rounded-lg p-6 flex flex-col transform hover:scale-105 transition-transform duration-300`}>
        <h3 className="text-2xl font-bold text-center">{plan.nombre}</h3>
        {plan.destacado && <p className="text-center text-green-400 font-bold mb-4">Más Popular</p>}
        <p className="text-4xl font-extrabold text-center my-4">{plan.informes}<span className="text-lg font-normal"> Informes</span></p>
        <p className="text-center text-gray-400 mb-2">Precio Total: ${plan.precio.toLocaleString('es-AR')}</p>
        <p className="text-center text-gray-400 mb-6">Equivale a ${plan.precioUnitario.toLocaleString('es-AR')} por informe</p>
        <button 
            onClick={() => onSolicitar(plan)}
            className={`mt-auto ${plan.destacado ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'} text-white font-bold py-2 px-4 rounded-lg transition-colors`}
        >
            Contratar Paquete
        </button>
    </div>
);


export default function EmpresasPage() {
    const { user } = useAuth();
    const router = useRouter();

    const handleSolicitarPaquete = async (plan) => {
        if (!user) {
            alert("Necesitas iniciar sesión o registrarte para contratar un paquete.");
            router.push('/login');
            return;
        }
        
        try {
            // Creamos un nuevo documento en la colección "solicitudes" con la información del pack
            await addDoc(collection(db, "solicitudes"), {
                email: user.email,
                userId: user.uid,
                fecha: new Date(),
                tipo: 'pack_b2b',          // Identificador para tus métricas
                packNombre: plan.nombre,
                packInformes: plan.informes,
                precio: plan.precio,
                estado: 'pendiente_pago',
                nombreEmpresa: user.nombreEmpresa || 'No especificado' 
            });

            // Redirigimos al usuario al link de pago real del plan seleccionado
            window.location.href = plan.linkPago;

        } catch (error) {
            console.error("Error al crear la solicitud del pack:", error);
            alert("Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.");
        }
    };

    return (
        <div className="bg-gray-900 text-white">
            <Header />
            <main className="container mx-auto py-20 px-4">
                <section className="text-center">
                    <h1 className="text-5xl font-extrabold text-green-400">Packs de Informes para Empresas</h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mt-4">
                        Optimiza la evaluación de riesgo con nuestros paquetes B2B. Ideal para inmobiliarias, financieras, agencias y más.
                    </p>
                </section>
                <section className="mt-20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {planes.map(plan => (
                            <PlanCard key={plan.nombre} plan={plan} onSolicitar={handleSolicitarPaquete} />
                        ))}
                    </div>
                </section>
                <section className="mt-20 max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg">
                    <h2 className="text-3xl font-bold text-center mb-6">Contacta a un Asesor</h2>
                    <form className="space-y-6">
                        <div><label htmlFor="nombreEmpresa" className="block text-sm font-medium">Nombre Empresa</label><input type="text" id="nombreEmpresa" required className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                        <div><label htmlFor="emailEmpresa" className="block text-sm font-medium">Email de Contacto</label><input type="email" id="emailEmpresa" required className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                        <div><label htmlFor="mensaje" className="block text-sm font-medium">Mensaje</label><textarea id="mensaje" rows="4" className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea></div>
                        <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold">Enviar Consulta</button>
                    </form>
                </section>
            </main>
            <Footer />
        </div>
    );
}