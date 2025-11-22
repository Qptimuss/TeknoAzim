// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { pipeline, type Pipeline } from "https://esm.sh/@xenova/transformers@2.17.1";

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
let isModelLoading = false;

async function loadClassifier() {
  if (classifier !== null) return; // Zaten yüklüyse bekleme

  if (isModelLoading) {
    // Eğer başka bir işlem zaten yüklüyorsa, bitmesini bekle
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isModelLoading = true;
  console.log("AI model loading started...");
  
  try {
    // Modeli yüklerken özel bir zaman aşımı belirle (örneğin 60 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 saniye

    classifier = await pipeline('text-classification', 'savasy/bert-base-turkish-toxicity-classifier', {
      // progress_callback: (progress) => console.log('Loading progress:', progress),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log("AI model loaded successfully.");
  } catch (e) {
    console.error("Failed to load text classification model:", e);
    classifier = null; // Hata durumunda classifier'ı null yap
    throw new Error("AI modeli yüklenemedi. Lütfen daha sonra tekrar deneyin.");
  } finally {
    isModelLoading = false;
  }
}

// Fonksiyon başladığında modeli yüklemeye çalış (Isınma)
loadClassifier().catch(err => console.error("Warm-up error:", err));

async function getClassifier() {
  await loadClassifier();
  if (!classifier) {
    throw new Error("AI modeli kullanılamıyor.");
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