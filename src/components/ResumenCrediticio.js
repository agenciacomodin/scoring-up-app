// src/components/ResumenCrediticio.js
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Componente interno para el medidor de "Volumen Crediticio"
const MedidorCrediticio = ({ nivel }) => {
    let colorClase = 'bg-gray-600';
    let texto = 'No definido';
    let angulo = '-rotate-90'; // Neutral (flecha a la izquierda por defecto)

    if (nivel === 'bajo') {
        colorClase = 'bg-orange-500';
        texto = 'Bajo';
        angulo = '-rotate-135'; // Más a la izquierda
    } else if (nivel === 'medio') {
        colorClase = 'bg-yellow-500';
        texto = 'Medio';
        angulo = 'rotate-0'; // Hacia arriba
    } else if (nivel === 'bueno') {
        colorClase = 'bg-green-500';
        texto = 'Bueno';
        angulo = 'rotate-45'; // Hacia la derecha
    }

    return (
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center h-full">
            <p className="text-sm text-gray-400 mb-2">Volumen Crediticio (Simulado)</p>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${colorClase} border-4 border-gray-600`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 text-white transform ${angulo} transition-transform duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </div>
            <p className="mt-3 font-bold text-lg">{texto}</p>
        </div>
    );
};

// Componente interno para el gráfico de deudas
const GraficoDeudas = ({ data }) => (
    <div className="bg-gray-700 p-4 rounded-lg h-full">
         <h4 className="font-semibold text-center text-sm text-gray-400 mb-4">Composición de Deuda (Simulado)</h4>
        <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${(value/1000)}k`} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                <Tooltip cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }} />
                <Bar dataKey="monto" barSize={20}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4ade80' : '#2dd4bf'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// Componente principal que se exporta y se usará en la página de perfil
export default function ResumenCrediticio({ solicitud }) {
    // ---- DATOS SIMULADOS (En el futuro vendrán del análisis de la IA) ----
    const nivelCrediticio = "bueno"; // Puedes cambiar esto a 'bajo', 'medio' o 'bueno' para probar
    const dataDeudas = [
        { name: 'T. Crédito', monto: 150000 },
        { name: 'P. Personal', monto: 450000 },
        { name: 'Servicios', monto: 25000 },
        { name: 'Otros', monto: 75000 },
    ];
    // ----------------------------------------------------------------------

    // Solo mostramos el resumen si el informe ha sido enviado
    if (!solicitud || (solicitud.estado !== 'informe_enviado' && solicitud.estado !== 'Completado')) {
        return (
             <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-xl font-bold mb-4">Resumen Visual</h2>
                <p className="text-gray-400">Tu resumen visual aparecerá aquí cuando tu informe esté listo.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Tu Resumen Crediticio Visual</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <MedidorCrediticio nivel={nivelCrediticio} />
                <GraficoDeudas data={dataDeudas} />
            </div>
        </div>
    );
}