
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const PROMPT = `Você é um mecânico experiente e um especialista em veículos de emergência, especificamente ambulâncias. Seu objetivo é fornecer uma análise clara, concisa e acionável para um condutor de ambulância que não é um mecânico. Com base na descrição e/ou imagem fornecida, faça o seguinte:
1.  **Diagnóstico Preliminar:** Qual é o problema mais provável?
2.  **Nível de Risco:** Classifique o risco como Baixo, Médio ou Alto. (Ex: Alto - Risco de segurança imediato, não opere o veículo. Médio - Requer atenção em breve. Baixo - Monitorar, mas não crítico).
3.  **Ações Recomendadas:** O que o condutor deve fazer agora? (Ex: 'Notificar imediatamente o supervisor de frota', 'Verificar o nível do fluido de arrefecimento', 'Não dirigir o veículo').
Analise a seguinte informação e retorne sua resposta em formato JSON.`;


const schema = {
    type: Type.OBJECT,
    properties: {
        diagnostico: {
            type: Type.STRING,
            description: "Diagnóstico preliminar do problema."
        },
        risco: {
            type: Type.STRING,
            description: "Nível de risco (Baixo, Médio, Alto)."
        },
        acoes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de ações recomendadas para o condutor."
        }
    },
    required: ["diagnostico", "risco", "acoes"]
};

const QUICK_DIAGNOSIS_PROMPT = `Você é um assistente de mecânico. Com base na seguinte descrição de um problema em um veículo, forneça um diagnóstico preliminar muito breve (máximo de 1-2 frases). Não sugira ações ou níveis de risco. Apenas indique qual poderia ser o problema. Seja direto e conciso.

Descrição do problema:`;

export const getQuickDiagnosis = async (description: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API key for Gemini is not configured.");
        return '';
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${QUICK_DIAGNOSIS_PROMPT} ${description}`,
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error calling Gemini API for quick diagnosis:", error);
        return '';
    }
};


export const analyzeProblem = async (description: string, imageFile: File | null): Promise<AnalysisResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API key for Gemini is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const textPart = { text: `${PROMPT}\n\nDescrição do problema: ${description}` };
    const parts: ( {text: string} | {inlineData: {data: string, mimeType: string}} )[] = [textPart];

    if (imageFile) {
        const base64Data = await fileToBase64(imageFile);
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: imageFile.type,
            },
        };
        parts.unshift(imagePart);
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisResult;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Não foi possível analisar o problema. Tente novamente.");
    }
};
