import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { pipeline, type Pipeline } from "https://esm.sh/@xenova/transformers@2.17.1";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Katman 1: Anahtar Kelime Filtresi ---
const bannedWords = [
  "aptal", "salak", "gerizekalı", // Hakaret
  "lan", "oç", "amk", 
];

function containsBannedWords(text: string): boolean {
  const lowerCaseText = text.toLowerCase();
  return bannedWords.some(word => lowerCaseText.includes(word));
}

// --- Katman 2: Yapay Zeka Modeli (Tembel Yükleme) ---
let classifier: Pipeline | null = null;

async function getClassifier() {
  if (classifier === null) {
    try {
      console.log("AI model is loading for the first time...");
      classifier = await pipeline('text-classification', 'savasy/bert-base-turkish-toxicity-classifier');
      console.log("AI model loaded successfully.");
    } catch (e) {
      console.error("Failed to load text classification model:", e);
      throw new Error("AI modeli yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    }
  }
  return classifier;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Katman Kontrolü
    if (containsBannedWords(text)) {
      return new Response(JSON.stringify({
        isAllowed: false,
        reason: 'Uygunsuz kelime kullanımı tespit edildi.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Katman Kontrolü (Modeli burada çağır)
    const aiClassifier = await getClassifier();
    const result = await aiClassifier(text);
    const topResult = Array.isArray(result) ? result[0] : result;

    if (topResult.label === 'TOXIC' && topResult.score > 0.9) {
      return new Response(JSON.stringify({
        isAllowed: false,
        reason: 'Metin, topluluk kurallarına aykırı (toksik) içerik barındırıyor.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Her iki filtreden de geçtiyse izin ver.
    return new Response(JSON.stringify({ isAllowed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});