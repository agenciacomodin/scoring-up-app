const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const pdf = require("pdf-parse");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: functions.config().openai.key });

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
`;

// ** LÍNEA MODIFICADA: Cambiamos el nombre de la función **
exports.procesarInformePDF = functions.storage.onObjectFinalized(async (object) => {
    const filePath = object.name; 
    if (!filePath.startsWith("informes-pendientes/")) {
        return null;
    }

    const uid = filePath.split('/')[1].split('.pdf')[0];
    const solicitudRef = db.collection("solicitudes").doc(uid);
    
    try {
        await solicitudRef.update({ estado: 'Analizando con IA...' });

        const bucket = admin.storage().bucket(object.bucket);
        const fileBuffer = await bucket.file(filePath).download();
        
        const data = await pdf(fileBuffer[0]);
        const textoDelPDF = data.text.replace(/"/g, "'").slice(0, 15000);

        const promptFinal = PROMPT_MAGICO.replace("{textoDelPDF}", textoDelPDF);
        
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", 
            messages: [{ role: "user", content: promptFinal }],
            response_format: { type: "json_object" },
        });

        const analisisJSON = JSON.parse(response.choices[0].message.content);

        await solicitudRef.update({
            analisisIA: analisisJSON,
            estado: 'informe_enviado',
            fechaAnalisis: new Date(),
        });

        console.log(`Análisis para el usuario ${uid} completado.`);
        return null;

    } catch (error) {
        console.error("Error en la Cloud Function para el usuario:", uid, error);
        await solicitudRef.update({ estado: "Error en Análisis IA" });
        return null;
    }
});