
/**
 * Generates an intelligent response from Vexy the chatbot calling our backend API.
 * @param prompt The user's question about flags or countries.
 * @param countryContext Optional JSON data about the country currently being discussed.
 * @returns A string containing the AI-generated response.
 */
export const askVexy = async (prompt: string, countryContext?: any): Promise<string> => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, countryContext }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "I'm sorry, I'm having trouble thinking of an answer right now.";
  } catch (error) {
    console.error("Gemini service error:", error);
    return "Oops! I lost connection to my global database. Please ask again in a moment!";
  }
};
