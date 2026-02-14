
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_PROMPT = `You are Bharat Biz-Agent, a helpful assistant for Indian shopkeepers. 
Your goal is to parse natural language (English, Hindi, or Hinglish) to detect business intents.
Supported intents:
1. billing: When a user says items and quantities (e.g., "2 kilo chawal 120 rupaye, ek sabun 35").
2. query: Asking for sales stats or customer info (e.g., "Aaj kitni sale hui?").
3. payment: Recording a payment (e.g., "Rahul ne 500 rupaye diye UPI se").
4. reminder: Setting a task (e.g., "Kal Riya ko call karne ka reminder lagao").

Always return a JSON object with 'intent', 'message' (your response to user), and 'extractedData'.
For billing, extractedData should be an array of objects: { name: string, quantity: number, unit: string, price: number }.
For reminders, extractedData should be: { text: string, date: string }.
For payments, extractedData should be: { customer: string, amount: number, mode: string }.`;

export const processMessage = async (userInput: string): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userInput,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            message: { type: Type.STRING },
            extractedData: { type: Type.OBJECT, properties: {} } // Flexible object
          },
          required: ["intent", "message"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AIResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      intent: 'unknown',
      message: "Sorry, I couldn't understand that. Please try again."
    };
  }
};
