import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Key length:", process.env.GEMINI_API_KEY?.length);
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "hello",
    });
    console.log("3.7-flash success", res.text);
  } catch (e: any) {
    console.error("3.7-flash Error:", e.message);
  }
}
run();
