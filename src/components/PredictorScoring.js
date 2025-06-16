"use client";
import React from 'react';

const PredictorScoring = ({ movimientos, solicitud }) => {
    let puntajePredictor = 500;
    let consejos = [];
    let tendencia = 'estable';

    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, c) => a + c.monto, 0);
    if (ingresos > 0) {
        const balanceMensual = ingresos - (-movimientos.filter(m => m.tipo === 'egreso').reduce((a, c) => a + c.monto, 0));
        if (balanceMensual > 0) {
            puntajePredictor += 150;
            tendencia = 'mejorando';
            consejos.push("👍 ¡Excelente! Tienes un balance positivo. Esto demuestra capacidad de pago y es muy valorado.");
        } else {
            puntajePredictor -= 100;
            tendencia = 'empeorando';
            consejos.push("👎 ¡Alerta! Estás gastando más de lo que ingresas. Esto puede ser una señal de riesgo. Revisa tus gastos.");
        }
    } else {
        consejos.push("📊 Registra tus ingresos para tener un análisis de balance más preciso.");
    }

    if (solicitud && solicitud.analisisIA) {
        if (solicitud.analisisIA.necesitaAyuda) {
            puntajePredictor -= 250;
            tendencia = 'empeorando';
            consejos.push("🚨 Tu informe crediticio tiene alertas. Este es el factor que más afecta tu scoring. ¡Solucionarlo es la prioridad!");
        } else {
            puntajePredictor += 200;
            consejos.push("✅ Tu informe Veraz está limpio de deudas graves. ¡Este es tu mayor activo crediticio!");
        }
    } else {
        consejos.push("💡 Aún no hemos analizado tu informe crediticio. Pídelo para tener un diagnóstico completo y preciso.");
    }
    
    const deudaTarjeta = -movimientos.filter(m => m.categoria === 'tarjeta').reduce((a,c) => a+c.monto, 0);
    if (ingresos > 0 && (deudaTarjeta / ingresos) > 0.4) {
        puntajePredictor -= 100;
        consejos.push("💳 Estás usando más del 40% de tus ingresos para pagar deudas de tarjetas. Intenta bajar este porcentaje para reducir tu riesgo.");
    }
    
    if (puntajePredictor > 999) puntajePredictor = 999;
    if (puntajePredictor < 1) puntajePredictor = 1;

    let colorTendencia = "text-gray-400";
    let iconoTendencia = "—";
    if (tendencia === 'mejorando') {
        colorTendencia = "text-green-400";
        iconoTendencia = "↑";
    } else if (tendencia === 'empeorando') {
        colorTendencia = "text-red-400";
        iconoTendencia = "↓";
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Tu Predictor de Scoring</h2>
            <div className="flex items-center justify-around bg-gray-900 p-4 rounded-lg">
                <div>
                    <p className="text-gray-400 text-sm">Tu Score Predicho</p>
                    <p className="text-5xl font-bold text-green-400">{Math.round(puntajePredictor)}</p>
                    <p className="text-gray-400 text-sm">/ 1000</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm">Tendencia</p>
                    <p className={`text-6xl font-bold ${colorTendencia}`}>{iconoTendencia}</p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-semibold mb-3">Consejos de tu Asesor para Mejorar:</h3>
                <ul className="space-y-3">
                    {consejos.map((consejo, index) => (
                        <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-3 mt-1">✔</span> 
                        <span className="text-gray-300">{consejo}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PredictorScoring;