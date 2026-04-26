import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async generateCaption(topic: string = "") {
    try {
      const prompt = `Generate a short, trendy, and "astig" (cool) caption for a Filipino "flex" social media app. 
      Topic: ${topic || "a general cool item/experience"}
      Format: Taglish (Tagalog-English mix)
      Mood: Proud, grateful, or slightly boastful but humble ("low-key flex").
      Length: Max 15 words.
      Include 1-2 relevant emojis.
      Do NOT include hashtags.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text?.trim() || "";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Legit Flex lang tayo dito! 🚀";
    }
  }
};
