"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MedidorCrediticio = ({ nivel }) => { /* ... tu código Medidor no cambia ... */ let c='bg-gray-600',t='No def.',a='-rotate-90'; if(nivel==='bajo'){c='bg-orange-500';t='Bajo';a='-rotate-135'}else if(nivel==='medio'){c='bg-yellow-500';t='Medio';a='rotate-0'}else if(nivel==='bueno'){c='bg-green-500';t='Bueno';a='rotate-45'} return(<div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center h-full"><p className="text-sm text-gray-400 mb-2">Nivel Riesgo</p><div className={`w-24 h-24 rounded-full flex items-center justify-center ${c} border-4 border-gray-600`}><svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 text-white transform ${a} transition-transform duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></div><p className="mt-3 font-bold text-lg">{t}</p></div>) };
const GraficoDeudas = ({ data }) => { /* ... tu código Gráfico no cambia ... */ };

export default function ResumenCrediticio({ solicitud }) {
    if (!solicitud || !solicitud.analisisIA) {
        return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold">Resumen Crediticio</h2><p className="text-gray-400 mt-4">Analizaremos tu informe aquí una vez que esté completado.</p></div> );
    }

    const { analisisIA } = solicitud;
    let nivelCrediticio = 'medio';
    if (analisisIA.score && parseInt(analisisIA.score) <= 2) { nivelCrediticio = 'bajo'; }
    else if (analisisIA.score && parseInt(analisisIA.score) >= 5) { nivelCrediticio = 'bueno'; }

    const dataDeudas = (analisisIA.alertasCriticas || []).map((alerta, index) => ({ name: alerta.substring(0, 15) + '...', value: index + 1 }));

    return ( <div className="bg-gray-800 p-6 rounded-lg"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Tu Resumen Crediticio</h2><div className="text-right"><p className="text-gray-400 text-sm">Score Veraz</p><p className="text-3xl font-bold text-green-400">{analisisIA.score}</p></div></div><div className="grid md:grid-cols-2 gap-8"><MedidorCrediticio nivel={nivelCrediticio} /><GraficoDeudas data={dataDeudas} /></div></div> );
}