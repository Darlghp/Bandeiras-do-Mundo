import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  let countriesCache: any = null;
  let cacheTimestamp = 0;

  app.get("/api/countries", async (req, res) => {
    try {
      if (countriesCache) {
        return res.json(countriesCache);
      }
      
      const filePath = path.join(process.cwd(), 'countries.json');
      const data = fs.readFileSync(filePath, 'utf8');
      countriesCache = JSON.parse(data);
      
      res.json(countriesCache);
    } catch (error) {
      console.error("Countries provider error:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, countryContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }

      const ai = new GoogleGenAI({ apiKey });

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
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.75,
          topP: 0.9,
        },
      });

      res.json({ text: response.text || "I'm sorry, I'm having trouble thinking of an answer right now." });
    } catch (error) {
      console.error("Gemini service error:", error);
      res.status(500).json({ error: "Oops! I lost connection to my global database. Please ask again in a moment!" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
