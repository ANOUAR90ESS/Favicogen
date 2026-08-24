import express, { NextFunction, Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key to .env or environment settings."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  // Cloud hosts assign the port; a hard-coded 3000 makes the app unreachable
  // on Heroku, Render, Cloud Run and anything else that sets PORT.
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "0.0.0.0";

  const isProduction = process.env.NODE_ENV === "production";

  // Behind a load balancer the client IP arrives in X-Forwarded-For; without
  // this every request looks like it comes from the proxy and the rate limit
  // applies to all users at once.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // The app inlines styles and loads Google Fonts, and rasterizes SVG
      // through blob: URLs, so the default CSP would break it.
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              imgSrc: ["'self'", "data:", "blob:"],
              connectSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
              ],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false,
      // Blob URLs feed <img> during rasterization.
      crossOriginResourcePolicy: { policy: "same-site" },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Same-origin by default. Set ALLOWED_ORIGINS to a comma-separated list to
  // permit specific cross-origin callers.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    } else if (origin) {
      return res.status(403).json({ success: false, error: "Origin not allowed." });
    }

    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  });

  // The AI routes spend the operator's Gemini quota, and nothing about them
  // is authenticated, so an open endpoint is someone else's bill. These
  // limits are per IP.
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many AI requests from this address. Please try again later.",
    },
  });

  const burstLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: "You are sending AI requests too quickly. Please wait a moment.",
    },
  });

  app.use("/api/ai", burstLimiter, aiLimiter);

  // Sized for a single base64 reference image; the client caps uploads at
  // 10MB, so 25MB was headroom nobody needed and an easy memory-pressure lever.
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ extended: true, limit: "12mb" }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Image Generation Endpoint (from Prompt + Optional Reference Image)
  app.post("/api/ai/generate-logo", async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        referenceImage,
        style = "modern-vector",
        aspectRatio = "1:1",
        target = "logo", // 'logo' | 'banner' | 'avatar'
      } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required to generate an image.",
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          error:
            "GEMINI_API_KEY is not set. Please configure your API key to generate logos with AI.",
          isApiKeyMissing: true,
        });
      }

      const ai = getGenAI();

      // Refined prompt tailored for logos, favicons, and channel branding
      let styleGuidance = "";
      switch (style) {
        case "minimal":
          styleGuidance =
            "minimalist, clean lines, flat vector design, iconic silhouette, isolated on solid or clean background, no clutter, modern corporate identity style";
          break;
        case "modern-3d":
          styleGuidance =
            "modern 3D glossy render, smooth gradient shading, depth, soft ambient occlusion, clean icon, high visual contrast, digital product app icon";
          break;
        case "flat-vector":
          styleGuidance =
            "pure flat 2D vector graphic, sharp edges, bold geometric shapes, Swiss graphic design style, vibrant harmonious color palette";
          break;
        case "luxury-gold":
          styleGuidance =
            "premium luxury brand emblem, gold metallic foil accents, dark obsidian background, elegant intricate geometry, prestige identity";
          break;
        case "cyberpunk":
          styleGuidance =
            "cyberpunk neon glow, futuristic tech icon, vibrant cyan and magenta lights, dark sleek aesthetic, gaming mascot or synthwave logo";
          break;
        case "arabesque":
          styleGuidance =
            "modern Arabic calligraphy and geometric arabesque ornament, luxury modern Middle Eastern aesthetic, gold and deep royal teal/indigo";
          break;
        case "mascot":
          styleGuidance =
            "charismatic mascot character logo, dynamic stylized vector, esports and YouTube gaming branding, high energy and bold outlines";
          break;
        case "youtube-banner":
          styleGuidance =
            "wide cinematic YouTube channel banner header, 16:9 panoramic wallpaper, central focus for mobile safe area, epic lighting, professional streamer and creator background";
          break;
        default:
          styleGuidance =
            "professional logo icon, centered, clean background, balanced negative space, high resolution vector aesthetic";
      }

      const fullPrompt = `${prompt.trim()}. Style details: ${styleGuidance}. Centered subject, clear focal point, professional graphic design masterpiece.`;

      // Build contents parts
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // If user uploaded a reference image, parse base64
      if (referenceImage && typeof referenceImage === "string") {
        const match = referenceImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      // Add text prompt
      parts.push({
        text: fullPrompt,
      });

      // Select aspect ratio
      const validAspectRatios: Array<"1:1" | "16:9" | "4:3" | "3:4" | "9:16"> = [
        "1:1",
        "16:9",
        "4:3",
        "3:4",
        "9:16",
      ];
      const selectedRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

      // Call Gemini Image generation model
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: parts as any,
        },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio,
            imageSize: "1K",
          },
        },
      });

      let generatedDataUrl: string | null = null;
      let textExplanation = "";

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const mime = part.inlineData.mimeType || "image/png";
            generatedDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textExplanation += part.text;
          }
        }
      }

      if (!generatedDataUrl) {
        return res.status(500).json({
          success: false,
          error: "No image was returned by the AI model. Please try a different prompt.",
          details: textExplanation,
        });
      }

      return res.json({
        success: true,
        imageUrl: generatedDataUrl,
        prompt: prompt.trim(),
        style,
        aspectRatio: selectedRatio,
      });
    } catch (err: any) {
      console.error("AI Logo generation error:", err);
      const errorMessage = err?.message || "";
      if (errorMessage.includes("401") || errorMessage.includes("invalid authentication credentials") || errorMessage.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
        return res.status(401).json({
          success: false,
          error: "Your Gemini API Key appears to be invalid or unsupported. Please go to Settings > Secrets and update your GEMINI_API_KEY.",
        });
      }
      return res.status(500).json({
        success: false,
        error: "Failed to generate image with AI. " + (err?.message || "Please verify your prompt or API key."),
      });
    }
  });

  // AI Prompt Enhancer Endpoint (Refines simple descriptions into rich prompts)
  app.post("/api/ai/enhance-prompt", async (req: Request, res: Response) => {
    try {
      const { prompt, language = "ar", type = "logo" } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required.",
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          error: "GEMINI_API_KEY is not configured.",
          isApiKeyMissing: true,
        });
      }

      const ai = getGenAI();

      const systemPrompt = `You are a world-class graphic designer and brand identity specialist.
Your task is to take a user's short or basic prompt for a ${type === "banner" ? "YouTube channel banner (16:9)" : "logo / favicon icon (1:1)"} and expand it into a vivid, descriptive prompt that yields stunning graphic design results when passed to an image generation model.
- Keep the enhanced prompt focused on visual elements, shapes, colors, geometry, lighting, and composition.
- Return output strictly in JSON format with fields:
  "enhancedPromptEn": English version of the enhanced prompt optimized for image generation models,
  "enhancedPromptAr": Arabic translation of the enhanced prompt,
  "suggestedColors": array of 2 to 4 hex color strings (e.g. ["#4f46e5", "#06b6d4"]),
  "suggestedTitle": short recommended brand or channel name (1-3 words),
  "suggestedTagline": short catchy slogan or tagline (3-6 words)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `User idea: "${prompt.trim()}". Target language preference: ${language}. Enhance this prompt for a professional ${type}.`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);

      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      console.error("AI prompt enhance error:", err);
      const errorMessage = err?.message || "";
      if (errorMessage.includes("401") || errorMessage.includes("invalid authentication credentials") || errorMessage.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
        return res.status(401).json({
          success: false,
          error: "Your Gemini API Key appears to be invalid or unsupported. Please go to Settings > Secrets and update your GEMINI_API_KEY.",
        });
      }
      return res.status(500).json({
        success: false,
        error: "Failed to enhance prompt. " + (err?.message || ""),
      });
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

  app.listen(PORT, HOST, () => {
    console.log(`Logo & Favicon Studio server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  // Without this the process lingers with no listener, so orchestrators see a
  // healthy container in front of a dead server.
  process.exit(1);
});

