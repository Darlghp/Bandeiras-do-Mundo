
// Gemini API service for advanced reasoning and contextual information.
import { GoogleGenAI } from "@google/genai";

/**
 * Generates an intelligent response from Vexy the chatbot using Gemini 3 Flash.
 * @param prompt The user's question about flags or countries.
 * @param countryContext Optional JSON data about the country currently being discussed.
 * @returns A string containing the AI-generated response.
 */
export const askVexy = async (prompt: string, countryContext?: any): Promise<string> => {
  try {
    // New instance created right before use to ensure API_KEY is available
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      You are Vexy, a friendly and extremely knowledgeable AI vexillologist.
      Your expertise covers all world flags, their symbolism, history, and the countries they represent.
      Use professional yet approachable language. 
      Format your responses using Markdown (bolding, lists, etc.) for better readability.
      If context about a specific country is provided, use it to give more precise answers.
      Keep responses relatively concise but thorough.
    `;

    const contents = countryContext 
      ? `Query: ${prompt}\n\nRelevant Country Context: ${JSON.stringify(countryContext)}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.75,
        topP: 0.9,
      },
    });

    return response.text || "I'm sorry, I'm having trouble thinking of an answer right now.";
  } catch (error) {
    console.error("Gemini service error:", error);
    return "Oops! I lost connection to my global database. Please ask again in a moment!";
  }
};
