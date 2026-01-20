
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
  
  // Prompt optimizado para velocidad y socratismo estricto
  const systemInstruction = language === 'es' ? `
    Eres el "Coach Socrático Fontys". 
    ORACIÓN: "${sentence}"
    META PASO ${currentStep}: ${stepGoals[currentStep]}
    PROGRESO: [${progress}]

    REGLAS (SOCRATISMO):
    1. PROHIBIDO DAR RESPUESTAS. Si falla, pregunta algo para que mire la oración.
    2. BREVEDAD: Máximo 1-2 líneas.
    3. Si acierta: Valida y pregunta por el siguiente paso.
    4. SUGERENCIAS: 3 opciones. Una debe ser una pregunta-pista.
    5. IDIOMA: Español.
  ` : `
    Je bent de "Fontys Socratische Coach".
    ZIN: "${sentence}"
    DOEL STAP ${currentStep}: ${stepGoals[currentStep]}
    VOORTGANG: [${progress}]

    REGELS:
    1. GEEN ANTWOORDEN GEVEN. Bij fouten: stel een ontdekkingsvraag over de zin.
    2. KORT: Max 1-2 regels.
    3. Bij goed: Bevestig en vraag naar de volgende stap.
    4. SUGGESTIES: 3 opties. Eén moet een hint-vraag zijn.
    5. TAAL: Nederlands.
  `;

  try {
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            { text: `Historial: ${chatHistory.slice(-3).map(m => m.sender[0] + ":" + m.text).join("|")}` },
            { text: `Alumno: "${userInput}".` }
        ],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1, // Menor temperatura = mayor velocidad y coherencia
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
        responseText: language === 'es' ? "¿Podrías repetir?" : "Kun je dat herhalen?", 
        nextStep: currentStep, 
        suggestions: [language === 'es' ? "Reintentar" : "Opnieuw"] 
    };
  }
}

export async function generatePortflowSummary(sentence: string, answers: { cost: string, learned: string }, language: Language = 'es'): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Resumen portafolio (50 palabras). Oración: "${sentence}". Dificultad: "${answers.cost}". Aprendizaje: "${answers.learned}". Idioma: ${language}.`,
    config: { temperature: 0.2 }
  });
  return response.text.trim();
}
