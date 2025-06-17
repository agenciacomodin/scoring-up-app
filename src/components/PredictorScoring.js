"use client";
import React from 'react';
import Link from 'next/link';

export default function PredictorScoring({ movimientos, solicitud }) {

    // Condición inicial: Si el usuario NUNCA ha solicitado un informe, mostramos un CTA.
    if (!solicitud) {
        return (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg text-center shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Comienza a Construir tu Futuro Crediticio</h2>
                <p className="text-gray-200 mb-4">El primer paso para mejorar es conocer tu punto de partida. Solicita tu informe Veraz para desbloquear tu Predictor de Scoring y recibir consejos personalizados.</p>
                <Link href="/perfil" onClick={() => {/* Aquí podrías añadir una función para cambiar de pestaña */}} className="bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors">
                    Solicitar Mi Primer Informe
                </Link>
            </div>
        );
    }
    
    // --- LÓGICA DE CÁLCULO (Solo se ejecuta si hay una solicitud) ---
    let puntajePredictor = 500;
    let consejos = [];
    let tendencia = 'estable';

    // (La lógica de cálculo que ya teníamos no cambia...)
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, c) => a + c.monto, 0);
    if (ingresos > 0) { const balanceMensual = ingresos - (-movimientos.filter(m => m.tipo === 'egreso').reduce((a, c) => a + c.monto, 0)); if (balanceMensual > 0) { puntajePredictor += 150; tendencia = 'mejorando'; consejos.push("👍 ¡Balance positivo! Demuestra excelente capacidad de pago."); } else { puntajePredictor -= 100; tendencia = 'empeorando'; consejos.push("👎 ¡Alerta de balance! Gastas más de lo que ingresa, señal de riesgo."); } }
    else { consejos.push("📊 Registra tus ingresos y egresos para un análisis más preciso."); }
    if (solicitud && solicitud.analisisIA) { if (solicitud.analisisIA.necesitaAyuda) { puntajePredictor -= 250; if(tendencia !== 'empeorando') tendencia = 'empeorando'; consejos.push("🚨 ¡Prioridad máxima! Tu informe tiene alertas que afectan tu score. ¡Contáctanos para resolverlo!"); } else { puntajePredictor += 200; consejos.push("✅ ¡Excelente! Tu informe está libre de deudas problemáticas. ¡Cuídalo!"); } }
    else { consejos.push("💡 Tu informe está siendo procesado. El predictor se actualizará con el análisis de la IA."); }
    puntajePredictor = Math.max(1, Math.min(puntajePredictor, 999));
    let colorTendencia = "text-gray-400", iconoTendencia = "—";
    if (tendencia === 'mejorando') { colorTendencia = "text-green-400"; iconoTendencia = "↑"; } 
    else if (tendencia === 'empeorando') { colorTendencia = "text-red-400"; iconoTendencia = "↓"; }

    return ( <div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h2 className="text-2xl font-bold mb-4">Tu Predictor de Scoring</h2><div className="flex items-center justify-around bg-gray-900 p-4 rounded-lg"><div><p className="text-gray-400 text-sm">Tu Score Predicho</p><p className="text-5xl font-bold text-green-400">{Math.round(puntajePredictor)}</p><p className="text-gray-400 text-sm">/ 1000</p></div><div className="text-center"><p className="text-gray-400 text-sm">Tendencia</p><p className={`text-6xl font-bold ${colorTendencia}`}>{iconoTendencia}</p></div></div><div className="mt-6"><h3 className="font-semibold mb-3">Consejos Personalizados:</h3><ul className="space-y-3">{consejos.map((c, i) => (<li key={i} className="flex items-start"><span className="text-green-400 mr-3 mt-1">✔</span><span className="text-gray-300">{c}</span></li>))}</ul></div></div>);
}