import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const models = ["gemini-3.1-flash-preview", "gemini-3.1-flash", "gemini-1.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: "hello",
      });
      console.log(m, "success:", res.text.slice(0, 10));
    } catch (e: any) {
      console.error(m, "Error:", e.message.slice(0, 50));
    }
  }
}
run();
