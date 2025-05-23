// // lib/gemini.ts
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export const initializeGemini = () => {
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
//   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
//   return model;
// };
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const initializeGemini = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // ✅ Updated model name
  return model;
};