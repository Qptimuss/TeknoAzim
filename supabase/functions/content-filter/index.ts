import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { pipeline } from "https://esm.sh/@xenova/transformers@2.17.1";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Katman 1: Anahtar Kelime Filtresi ---
// Bu listeyi istediğimiz gibi genişletebiliriz.
const bannedWords = [
  "aptal", "salak", "gerizekalı", // Hakaret
  // --- Cinsel içerik ve küfürler buraya eklenebilir ---
  // Örnek olarak birkaç kelime ekliyorum, bu liste detaylandırılmalı.
  "lan", "oç", "amk", 
];

// Metnin içinde yasaklı kelime olup olmadığını kontrol eden fonksiyon
function containsBannedWords(text: string): boolean {
  const lowerCaseText = text.toLowerCase();
  return bannedWords.some(word => lowerCaseText.includes(word));
}

// --- Katman 2: Yapay Zeka Modeli ---
// Modeli bir kere yükleyip tekrar kullanmak için sınıf dışında tanımlıyoruz.
const classifier = await pipeline('text-classification', 'savasy/bert-base-turkish-toxicity-classifier');

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
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

    // 2. Katman Kontrolü
    const result = await classifier(text);
    const topResult = result[0];

    // Modelin sonucuna göre karar ver.
    // 'TOXIC' etiketini %90'dan fazla bir güvenle tahmin ederse engelle.
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
    console.error(error);
    return new Response(JSON.stringify({ error: 'An internal error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});