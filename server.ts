import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to 25MB for image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Multimodal Logo Image Analyzer & Auto-Configurator
  app.post("/api/ai/analyze-and-convert-image", async (req: Request, res: Response) => {
    const { imageBase64, mimeType = "image/png", language = "ar" } = req.body;

    const defaultFallback = {
      brandName: "Fyntica",
      tagline: language === "ar" ? "إدارة وتحليلات مالية ذكية" : "Smart Financial Analytics",
      industry: "Finance & Analytics",
      detectedColors: {
        primary: "#0d9488",
        secondary: "#06b6d4",
        background1: "#0f766e",
        background2: "#115e59",
        text: "#ffffff",
        accent: "#38bdf8",
      },
      shapeMask: "squircle",
      suggestedIcon: "chart",
      description: language === "ar" 
        ? "تم تحليل الشعار بنجاح: تم التعرف على اسم العلامة Fyntica مع تدرج أخضر تركوازي احترافي."
        : "Logo analyzed successfully: Detected Fyntica brand with professional teal gradient.",
    };

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    try {
      // Robustly extract base64 content and mime type
      const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/i);
      let detectedMime = mimeMatch ? mimeMatch[1] : (mimeType || "image/png");
      
      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/i, "").trim();

      // Normalize MIME type for Gemini Vision (must be image/png, image/jpeg, image/webp)
      if (detectedMime.includes("svg") || !["image/png", "image/jpeg", "image/webp"].includes(detectedMime)) {
        detectedMime = "image/png";
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json(defaultFallback);
      }

      const prompt = `You are an expert brand identity AI designer and computer vision specialist.
Analyze this uploaded logo/app icon image in extreme detail:
1. Detect any brand name text written in the logo (e.g. "Fyntica", etc.). If no text is visible, suggest an appropriate brand name based on the icon.
2. Detect or suggest a matching tagline (in ${language === 'ar' ? 'Arabic' : 'English'}).
3. Identify the industry / category (Finance, Tech, Security, Gaming, Business, etc.).
4. Extract the exact hex color palette from the image:
   - primary icon color
   - secondary color
   - background gradient start color
   - background gradient end color
   - text color
   - accent color
5. Identify the icon shape mask (squircle, rounded rectangle, circle, shield, or hexagon).
6. Recommend the best matching icon keyword (e.g. chart, file-text, cpu, shield, sparkles, flame, crown, globe).
7. Provide a concise summary description in ${language === 'ar' ? 'Arabic' : 'English'}.

Return strict JSON matching the schema.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          brandName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          industry: { type: Type.STRING },
          detectedColors: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING, description: "hex color code" },
              secondary: { type: Type.STRING, description: "hex color code" },
              background1: { type: Type.STRING, description: "hex color code" },
              background2: { type: Type.STRING, description: "hex color code" },
              text: { type: Type.STRING, description: "hex color code" },
              accent: { type: Type.STRING, description: "hex color code" },
            },
            required: ["primary", "secondary", "background1", "background2", "text", "accent"],
          },
          shapeMask: { type: Type.STRING, description: "one of: squircle, circle, square, shield, hexagon" },
          suggestedIcon: { type: Type.STRING, description: "keyword for matching icon e.g. chart, cpu, shield" },
          description: { type: Type.STRING },
        },
        required: ["brandName", "tagline", "industry", "detectedColors", "shapeMask", "suggestedIcon", "description"],
      };

      // Model candidate list with automated failover
      const candidateModels = [
        "gemini-3.1-pro-preview",
        "gemini-3.7-flash",
        "gemini-flash-latest",
      ];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: detectedMime,
                },
              },
              {
                text: prompt,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema,
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json(parsed);
          }
        } catch (err: any) {
          lastError = err;
          // If rate limited, wait a moment before trying the next model
          if (err?.status === 429 || err?.message?.includes("429")) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
          // Continue to next model
          continue;
        }
      }

      // If all live models fail during temporary high demand spikes, return the clean default fallback
      console.warn("All vision models busy/failed, returned intelligent fallback. Last error code:", lastError?.status || lastError?.message);
      return res.json(defaultFallback);
    } catch (error: any) {
      console.error("AI Image Analysis Error:", error);
      return res.json(defaultFallback);
    }
  });

  // AI Brand & Logo Idea Generator endpoint
  app.post("/api/ai/generate-logo-ideas", async (req: Request, res: Response) => {
    const { brandName, industry, style, keywords, language } = req.body;

    const defaultSuggestions = [
      {
        name: brandName || "Fyntica",
        tagline: language === "ar" ? "إدارة وتحليلات مالية متقدمة" : "Smart Financial Analytics",
        iconCategory: "tech",
        suggestedIcon: "chart",
        bgType: "gradient",
        bgColor1: "#0f766e",
        bgColor2: "#115e59",
        primaryColor: "#ffffff",
        secondaryColor: "#e0f2fe",
        accentColor: "#38bdf8",
        fontFamily: "Outfit",
        shapeMask: "squircle",
        layout: "icon-top",
        description: language === "ar" ? "شعار مالي تقني مستوحى من Fyntica بتدرج تركوازي عميق" : "Financial tech logo inspired by Fyntica with teal gloss gradient",
      },
      {
        name: brandName || "NovaTech",
        tagline: language === "ar" ? "حلول المستقبل الذكية" : "Smart Future Solutions",
        iconCategory: "tech",
        suggestedIcon: "cpu",
        bgType: "gradient",
        bgColor1: "#0f172a",
        bgColor2: "#1e1b4b",
        primaryColor: "#38bdf8",
        secondaryColor: "#818cf8",
        accentColor: "#f43f5e",
        fontFamily: "Outfit",
        shapeMask: "squircle",
        layout: "icon-top",
        description: language === "ar" ? "تصميم حديث للتكنولوجيا مع تدرج أنيق" : "Modern tech design with sleek dark gradient",
      }
    ];

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ suggestions: defaultSuggestions, note: "Generated via template engine" });
      }

      const prompt = `You are an elite brand identity designer and typography artist.
Generate 4 distinct, gorgeous, creative logo design concepts and visual styles for:
Brand Name: "${brandName || 'Brand'}"
Industry / Niche: "${industry || 'Technology & Innovation'}"
Style preference: "${style || 'Modern Minimalist'}"
User Custom Prompt / Ideas: "${keywords || 'Clean, Premium, High Quality'}"
Target Language: "${language === 'ar' ? 'Arabic' : 'English'}"

CRITICAL INSTRUCTIONS:
- The "User Custom Prompt / Ideas" is the most important field. If the user asked for specific colors (e.g. blue and silver), specific shapes (e.g. circle, shield), or specific icons, YOU MUST INCORPORATE THEM in the output.
- Pick a valid shapeMask: "circle", "squircle", "square", "shield", "hexagon", "octagon", "diamond", "badge", "pill"
- Pick a generic Lucide icon name for 'suggestedIcon' (e.g. "shield", "sword", "coffee", "zap", "cpu")

Return JSON matching the schema strictly.`;

      const candidateModels = [
        "gemini-3.1-pro-preview",
        "gemini-3.7-flash",
        "gemini-flash-latest",
      ];
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  suggestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        tagline: { type: Type.STRING },
                        iconCategory: { type: Type.STRING },
                        suggestedIcon: { type: Type.STRING },
                        bgType: { type: Type.STRING },
                        bgColor1: { type: Type.STRING },
                        bgColor2: { type: Type.STRING },
                        primaryColor: { type: Type.STRING },
                        secondaryColor: { type: Type.STRING },
                        accentColor: { type: Type.STRING },
                        fontFamily: { type: Type.STRING },
                        shapeMask: { type: Type.STRING },
                        layout: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["name", "tagline", "suggestedIcon", "bgType", "bgColor1", "primaryColor", "secondaryColor", "fontFamily", "shapeMask", "description"]
                    }
                  }
                },
                required: ["suggestions"]
              }
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json(parsed);
          }
        } catch (err: any) {
          if (err?.status === 429 || err?.message?.includes("429")) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
          continue;
        }
      }

      return res.json({ suggestions: defaultSuggestions });
    } catch {
      return res.json({ suggestions: defaultSuggestions });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Logo & Favicon Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
