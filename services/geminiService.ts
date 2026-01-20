
import { GoogleGenAI, Type } from "@google/genai";
import type { Language, Message, TutorResponse, AnalysisUpdate } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const reader = new FileReader();
    const imageBase64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(imageFile);
    });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{inlineData: {data: imageBase64, mimeType: imageFile.type}}, {text: "Extract sentence only."}] },
    });
    return response.text.trim();
  } catch (error) { return "Error."; }
}

const STEP_GOALS_ES: Record<number, string> = {
    1: "Vocabulario", 2: "Verbos", 3: "Nexos", 4: "Proposiciones",
    5: "Sujeto/Predicado", 6: "Cat. Nexo", 7: "Clase", 8: "Tipo", 9: "Función"
};

const STEP_GOALS_NL: Record<number, string> = {
    1: "Woorden", 2: "Werkwoorden", 3: "Voegwoorden", 4: "Deelzinnen",
    5: "Onderwerp/Gezegde", 6: "Cat. Voegwoord", 7: "Klasse", 8: "Type", 9: "Functie"
};

export async function getTutorResponse(
  language: Language,
  sentence: string,
  currentStep: number,
  chatHistory: Message[],
  userInput: string,
  userName: string = "Estudiante",
  currentAnalysis: AnalysisUpdate[] = []
): Promise<TutorResponse> {
  
  const progress = currentAnalysis.map(a => `${a.type}:${a.text}`).join("|");
  const stepGoals = language === 'es' ? STEP_GOALS_ES : STEP_GOALS_NL;
  
  const systemInstruction = language === 'es' ? `
    Eres el "Coach Socrático Fontys". Tu meta es que el alumno DESCUBRA la sintaxis.
    ORACIÓN: "${sentence}"
    PASO ${currentStep}: ${stepGoals[currentStep]}
    PROGRESO: [${progress}]

    REGLAS DE ORO:
    1. PROHIBIDO DAR RESPUESTAS DIRECTAS.
    2. Si el alumno falla: Haz una pregunta que le obligue a observar la frase (ej. "¿Cuántos verbos ves?", "¿Hay alguna palabra que una dos ideas?").
    3. Si acierta: Valida con entusiasmo y lanza la pregunta del siguiente paso.
    4. BREVEDAD: 1 línea de texto.
    5. SUGERENCIAS: Siempre 3. Una debe ser una pista socrática.
  ` : `
    Je bent de "Fontys Socratische Coach". Laat de leerling zelf de syntaxis ONTDEKKEN.
    ZIN: "${sentence}"
    STAP ${currentStep}: ${stepGoals[currentStep]}
    VOORTGANG: [${progress}]

    GOUDEN REGELS:
    1. GEEF NOOIT DIRECT HET ANTWOORD.
    2. Bij fouten: Stel een vraag waardoor ze de zin beter bekijken (bijv. "Hoeveel werkwoorden zie je?").
    3. Bij goed: Bevestig en stel de vraag voor de volgende stap.
    4. KORT: Max 1 regel.
    5. SUGGESTIES: Altijd 3. Eén moet een socratische hint zijn.
  `;

  try {
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            { text: `Historial: ${chatHistory.slice(-2).map(m => m.sender[0] + ":" + m.text).join("|")}` },
            { text: `Alumno: "${userInput}".` }
        ],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0, // Latencia mínima y máxima consistencia
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    responseText: { type: Type.STRING },
                    nextStep: { type: Type.INTEGER },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    analysisUpdate: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                text: { type: Type.STRING },
                                step: { type: Type.INTEGER }
                            },
                            required: ["type", "text"]
                        }
                    }
                },
                required: ["responseText", "nextStep", "suggestions"]
            }
        }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    return { 
        responseText: language === 'es' ? "¿Podrías repetirlo?" : "Kun je dat herhalen?", 
        nextStep: currentStep, 
        suggestions: ["Reintentar"] 
    };
  }
}

export async function generatePortflowSummary(sentence: string, answers: { cost: string, learned: string }, language: Language = 'es'): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Resumen portafolio 40 palabras. Oración: "${sentence}". Reto: "${answers.cost}". Logro: "${answers.learned}". Idioma: ${language}.`,
    config: { temperature: 0 }
  });
  return response.text.trim();
}
